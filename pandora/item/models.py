# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from datetime import datetime
import os.path
import subprocess
from glob import glob
import shutil
import uuid
import unicodedata
from urllib import quote
import json

from django.db import models, transaction
from django.db.models import Q, Sum, Max
from django.conf import settings
from django.contrib.auth.models import User, Group
from django.db.models.signals import pre_delete
from django.utils import datetime_safe

import ox
from ox.django import fields
import ox.web.imdb
import ox.image

import managers
import utils
import tasks
from .timelines import join_tiles
from data_api import external_data

from archive import extract
from annotation.models import Annotation
from clip.models import Clip
from changelog.models import Changelog
import archive.models

from person.models import get_name_sort
from title.models import get_title_sort
from sequence.tasks import get_sequences

def get_id(info):
    q = Item.objects.all()
    for key in ('title', 'director', 'year'):
        #       'episodeTitle', 'episodeDirector', 'episodeYear', 'season', 'episode'):
        if key in info and info[key]:
            k = 'find__key'
            v = 'find__value'
            if key in Item.facet_keys + ['title']:
                k = 'facets__key'
                v = 'facets__value'
            if isinstance(info[key], list):
                for value in info[key]:
                    q = q.filter(**{k: key, v: value})
            else:
                q = q.filter(**{k:key, v:info[key]})
    if q.count() == 1:
        return q[0].itemId
    if settings.DATA_SERVICE:
        r = external_data('getId', info)
        if r['status']['code'] == 200:
            imdbId = r['data']['id']
            return imdbId
    return None

def get_item(info, user=None, async=False):
    '''
        info dict with:
            imdbId, title, director, year,
            season, episode, episodeTitle, episodeDirector, episodeYear
    '''
    item_data = {
        'title': info.get('title', ''),
        'director': info.get('director', []),
    }

    if filter(lambda k: k['id'] == 'year', settings.CONFIG['itemKeys']):
        item_data['year'] = info.get('year', '') or ''
    
    #add additional item metadata parsed from path
    for key in [i for i in info
        if i in set([k['id'] for k in settings.CONFIG['itemKeys']]) \
            and i not in ('language', ) \
            and i not in item_data]:
        item_data[key] = info[key]

    for key in ('episodeTitle', 'episodeDirector', 'episodeYear',
                'season', 'episode', 'seriesTitle'):
        if key in info and info[key]:
            item_data[key] = info[key]

    if settings.USE_IMDB:
        if 'imdbId' in info and info['imdbId']:
            try:
                item = Item.objects.get(itemId=info['imdbId'])
            except Item.DoesNotExist:
                item = Item(itemId=info['imdbId'])
                if 'title' in info and 'director' in info:
                    item.external_data = item_data
                item.user = user
                item.oxdbId = item.itemId
                item.save()
                if async:
                    tasks.update_external.delay(item.itemId)
                else:
                    item.update_external()
        else:
            itemId = get_id(info)
            if itemId:
                try:
                    item = Item.objects.get(itemId=itemId)
                except Item.DoesNotExist:
                    info['imdbId'] = itemId
                    item = get_item(info, user)
                return item
            try:
                item = Item.objects.get(itemId=info.get('oxdbId'))
            except Item.DoesNotExist:
                item = Item()
                item.user = user
                item.data = item_data
                item.itemId = info.get('oxdbId', item.oxdb_id())
                try:
                    existing_item = Item.objects.get(oxdbId=item.oxdb_id())
                    item = existing_item
                except Item.DoesNotExist:
                    item.oxdbId = item.oxdb_id()
                    p = item.save()
                    if not p:
                        tasks.update_poster.delay(item.itemId)
    else:
        qs = Item.objects.filter(find__key='title', find__value__iexact=info['title'])
        if 'year' in info:
            qs = qs.filter(find__key='year', find__value__iexact=str(info['year']))
        if qs.count() == 1:
            item = qs[0]
        else:
            item = Item()
            item.data = item_data
            item.user = user
            p = item.save()
            if not p:
                tasks.update_poster.delay(item.itemId)
    return item

class Item(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    user = models.ForeignKey(User, null=True, related_name='items')
    groups = models.ManyToManyField(Group, blank=True, related_name='items')

    #while metadata is updated, files are set to rendered=False
    rendered = models.BooleanField(default=False, db_index=True)
    #should be set based on user
    level = models.IntegerField(db_index=True)

    itemId = models.CharField(max_length=128, unique=True, blank=True)
    oxdbId = models.CharField(max_length=42, unique=True, blank=True, null=True)
    external_data = fields.DictField(default={}, editable=False)
    data = fields.DictField(default={}, editable=False)
    json = fields.DictField(default={}, editable=False)
    poster = models.ImageField(default=None, blank=True,
                               upload_to=lambda i, x: i.path("poster.jpg"))
    poster_source = models.TextField(blank=True)
    poster_height = models.IntegerField(default=0)
    poster_width = models.IntegerField(default=0)
    poster_frame = models.FloatField(default=-1)

    icon = models.ImageField(default=None, blank=True,
                             upload_to=lambda i, x: i.path("icon.jpg"))

    torrent = models.FileField(default=None, blank=True, max_length=1000,
                               upload_to=lambda i, x: i.path('torrent.torrent'))
    stream_info = fields.DictField(default={}, editable=False)

    #stream related fields
    stream_aspect = models.FloatField(default=4/3)

    objects = managers.ItemManager()

    def get(self, key, default=None):
        if key == 'rightslevel':
            return self.level
        if key == 'user':
            return self.user and self.user.username or None
        if key == 'groups':
            return [g.name for g in self.groups.all()]
        if self.data and key in self.data:
            return self.data[key]
        if self.external_data and key in self.external_data:
            return self.external_data[key]
        return default

    def access(self, user):
        if user.is_anonymous():
            level = 'guest'
        else:
            level = user.get_profile().get_level()
        editable = self.editable(user)
        if editable:
            return True
        if not self.rendered and settings.CONFIG.get('itemRequiresVideo'):
            return False
        allowed_level = settings.CONFIG['capabilities']['canSeeItem'][level]
        if self.level <= allowed_level:
            return True
        return False

    def editable(self, user):
        if user.is_anonymous():
            return False
        if user.get_profile().capability('canEditMetadata') == True or \
           user.is_staff or \
           self.user == user or \
           self.groups.filter(id__in=user.groups.all()).count() > 0:
            return True
        return False

    def edit(self, data):
        #FIXME: how to map the keys to the right place to write them to?
        if 'id' in data:
            #FIXME: check if id is valid and exists and move/merge items accordingly
            del data['id']
        if 'groups' in data:
            groups = data.pop('groups')
            if isinstance(groups, list):
                groups = filter(lambda g: g.strip(), groups)
                groups = [ox.escape_html(g) for g in groups]
                self.groups.exclude(name__in=groups).delete()
                current_groups = [g.name for g in self.groups.all()]
                for g in filter(lambda g: g not in current_groups, groups):
                    group, created = Group.objects.get_or_create(name=g)
                    self.groups.add(group)
        keys = [k['id'] for k in
                filter(lambda i: i.get('description'), settings.CONFIG['itemKeys'])]
        for k in keys:
            key = '%sdescription' % k
            if key in data:
                description = data.pop(key)
                if isinstance(description, dict):
                    for value in description:
                        d, created = Description.objects.get_or_create(key=k, value=value)
                        d.description = ox.sanitize_html(description[value])
                        d.save()
                else:
                    value = data.get(k, self.get(k, ''))
                    if not description:
                        description = ''
                    d, created = Description.objects.get_or_create(key=k, value=value)
                    d.description = ox.sanitize_html(description)
                    d.save()
        for key in data:
            if data[key] == None:
                if key in self.data:
                    del self.data[key]
            else:
                k = filter(lambda i: i['id'] == key, settings.CONFIG['itemKeys'])
                ktype = k and k[0].get('type') or ''
                if ktype == 'text':
                    self.data[key] = ox.sanitize_html(data[key])
                elif ktype == '[text]':
                    self.data[key] = [ox.sanitize_html(t) for t in data[key]]
                elif ktype == '[string]':
                    self.data[key] = [ox.escape_html(t) for t in data[key]]
                elif key in ('episodeTitle', 'seriesTitle', 'episodeDirector', 'seriesYear'):
                    self.data[key] = ox.escape_html(data[key])
                elif isinstance(data[key], basestring):
                    self.data[key] = ox.escape_html(data[key])
                elif isinstance(data[key], list):
                    def cleanup(i):
                        if isinstance(i, basestring):
                            i = ox.escape_html(i)
                        return i
                    self.data[key] = [cleanup(i) for i in data[key]]
                else:
                    self.data[key] = ox.escape_html(data[key])
        p = self.save()
        if not settings.USE_IMDB and filter(lambda k: k in ('title', 'director', 'year'), data):
            p = tasks.update_poster.delay(self.itemId)
        return p

    def log(self):
        c = Changelog(type='item')
        c.value = self.json
        c.save()

    def update_external(self):
        if settings.DATA_SERVICE and not self.itemId.startswith('0x'):
            response = external_data('getData', {'id': self.itemId})
            if response['status']['code'] == 200:
                self.external_data = response['data']
                p = self.save()
                if p:
                    p.wait()
                else:
                    self.make_poster(True)

    def add_default_data(self):
        for k in settings.CONFIG['itemKeys']:
            if 'default' in k and not k['id'] in self.data:
                self.data[k['id']] = k['default']

    def expand_connections(self):
        c = self.get('connections')
        if c:
            for t in c.keys():
                if c[t]:
                    if isinstance(c[t][0], basestring):
                        c[t]= [{'id': i, 'title': None} for i in c[t]]
                    ids = [i['id'] for i in c[t]]
                    known  = {}
                    for l in Item.objects.filter(itemId__in=ids):
                        known[l.itemId] = l.get('title')
                    for i in c[t]:
                        if i['id'] in known:
                            i['item'] = i['id']
                            i['title'] = known[i['id']]
                    c[t]= filter(lambda x: x['title'], c[t])
                if not c[t]:
                    del c[t]
        return c

    def __unicode__(self):
        year = self.get('year')
        if year:
            string = u'%s (%s)' % (ox.decode_html(self.get('title', 'Untitled')), self.get('year'))
        else:
            string = self.get('title', u'Untitled')
        return u'[%s] %s' % (self.itemId,string)

    def get_absolute_url(self):
        return '/%s' % self.itemId

    def save(self, *args, **kwargs):
        update_poster = False
        update_ids = False
        if not self.id:
            if self.user:
                self.level = settings.CONFIG['rightsLevel'][self.user.get_profile().get_level()]
            else:
                self.level = settings.CONFIG['rightsLevel']['member']
            if not self.itemId:
                self.itemId = str(uuid.uuid1())
            self.add_default_data()
            super(Item, self).save(*args, **kwargs)
            if not settings.USE_IMDB:
                self.itemId = ox.toAZ(self.id)

        #this does not work if another item without imdbid has the same metadata
        oxdbId = self.oxdb_id()
        if not settings.USE_IMDB:
            self.oxdbId = None
        elif oxdbId:
            if self.oxdbId != oxdbId:
                q = Item.objects.filter(oxdbId=oxdbId).exclude(id=self.id)
                if q.count() != 0:
                    if len(self.itemId) == 7:
                        self.oxdbId = None
                        q[0].merge_with(self, save=False)
                    else:
                        n = 1
                        key = 'episodeTitle' in self.data and 'episodeTitle' or 'title'
                        title = self.get(key, 'Untitled')
                        while q.count() != 0:
                            n += 1
                            self.data[key] = u'%s [%d]' % (title, n)
                            oxdbId = self.oxdb_id()
                            q = Item.objects.filter(oxdbId=oxdbId).exclude(id=self.id)
                self.oxdbId = oxdbId
                update_poster = True
                if len(self.itemId) != 7:
                    update_ids = True

        #id changed, what about existing item with new id?
        if settings.USE_IMDB and len(self.itemId) != 7 and self.oxdbId != self.itemId:
            self.itemId = self.oxdbId
            #FIXME: move files to new id here
        if settings.USE_IMDB and len(self.itemId) == 7:
            for key in ('title', 'year', 'director', 'season', 'episode',
                        'seriesTitle', 'episodeTitle'):
                if key in self.data:
                    del self.data[key]

        if self.poster and os.path.exists(self.poster.path):
            self.poster_height = self.poster.height
            self.poster_width = self.poster.width
        else:
            self.poster_height = 128
            self.poster_width = 80
        self.json = self.get_json()
        self.json['modified'] = datetime.now()
        super(Item, self).save(*args, **kwargs)
        self.update_find()
        self.update_sort()
        self.update_facets()
        if update_ids:
            for c in self.clips.all(): c.save()
            for a in self.annotations.all():
                public_id = a.public_id.split('/')[1]
                public_id = "%s/%s" % (self.itemId, public_id)
                if public_id != a.public_id:
                    a.public_id = public_id
                    a.save()
        tasks.update_file_paths.delay(self.itemId)
        if update_poster:
            return tasks.update_poster.delay(self.itemId)
        return None

    def delete_files(self):
        path = os.path.join(settings.MEDIA_ROOT, self.path())
        if os.path.exists(path):
            shutil.rmtree(path)

    def delete(self, *args, **kwargs):
        self.delete_files()
        super(Item, self).delete(*args, **kwargs)

    def merge_with(self, other, save=True):
        '''
            move all related tables to other and delete self
        '''
        for l in self.lists.all():
            l.remove(self)
            if l.items.filter(id=other.id).count() == 0:
                l.add(other)
        self.annotations.all().update(item=other, public_id=None)
        for a in other.annotations.filter(public_id=None).order_by('id'):
            a.set_public_id()

        if hasattr(self, 'files'):
            for f in self.files.all():
                f.item = other
                f.save()
        self.delete()
        if save:
            other.save()
            #FIXME: update poster, stills and streams after this

    def get_posters(self):
        url = self.prefered_poster_url()
        external_posters = self.external_data.get('posters', {})
        services = external_posters.keys()
        index = []
        for service in settings.POSTER_PRECEDENCE:
            if service in services:
                index.append(service)
        for service in services:
            if service not in index:
                index.append(service)
        if settings.URL not in index:
            index.append(settings.URL)

        posters = []
        poster = self.path('siteposter.jpg')
        poster = os.path.abspath(os.path.join(settings.MEDIA_ROOT, poster))
        if os.path.exists(poster):
            posters.append({
                'url': '/%s/siteposter.jpg' % self.itemId,
                'width': 640,
                'height': 1024,
                'source': settings.URL,
                'selected': url == None,
                'index': index.index(settings.URL)
            })

        for service in external_posters:
            p = external_posters[service][0]
            selected = True if self.poster_source and self.poster_source == service or url == p['url'] else False
            p['source'] = service
            p['selected'] = selected
            p['index'] = index.index(service)
            posters.append(p)
        posters.sort(key=lambda a: a['index'])
        return posters

    def get_frames(self):
        frames = []
        pframes = self.poster_frames()
        if pframes:
            pos = self.poster_frame
            if pos < 0:
                pos = int(len(pframes) / 2)
            p = 0
            for f in pframes:
                frames.append({
                    'index': p,
                    'position': f['position'],
                    'selected': p == pos,
                    'url': '/%s/posterframe%d.jpg' %(self.itemId, p),
                    'height': f['height'],
                    'width': f['width']
                })
                p += 1
        return frames

    def get_stream(self):
        for s in self.streams():
            return s.json()

    def get_layers(self, user=None):
        layers = {}
        for l in settings.CONFIG['layers']:
            name = l['id']
            ll = layers.setdefault(name, [])
            qs = Annotation.objects.filter(layer=name, item=self).order_by(
                    'start', 'end', 'sortvalue')
            if name == 'subtitles':
                qs = qs.exclude(value='')
            if l.get('private'):
                if user and user.is_anonymous():
                    user = None
                qs = qs.filter(user=user)
            for a in qs.order_by('start'):
                ll.append(a.json(user=user))
        return layers
    
    def get_documents(self, user=None):
        qs = self.documents.all()
        documents = [d.json(item=self) for d in qs]
        return sorted(documents, key=lambda d: d['index'])

    def get_json(self, keys=None):
        i = {
            'id': self.itemId,
            'rendered': self.rendered,
            'rightslevel': self.level
        }
        if self.user:
            i['user'] = self.user.username
        i.update(self.external_data)
        i.update(self.data)
        if settings.USE_IMDB:
            i['oxdbId'] = self.oxdbId or self.oxdb_id() or self.itemId
        for k in settings.CONFIG['itemKeys']:
            key = k['id']
            if not keys or key in keys:
                if key not in i:
                    value = self.get(key)
                    #also get values from sort table, i.e. numberof values
                    if not value:
                        try:
                            if self.sort and hasattr(self.sort, key):
                                value = getattr(self.sort, key)
                        except ItemSort.DoesNotExist:
                            pass
                    if value:
                        i[key] = value

        if 'cast' in i and isinstance(i['cast'][0], basestring):
            i['cast'] = [i['cast']]
        if 'cast' in i and isinstance(i['cast'][0], list):
            i['cast'] = map(lambda x: {'actor': x[0], 'character': x[1]}, i['cast'])

        if 'connections' in i:
            i['connections'] = self.expand_connections()

        if not keys or 'posterRatio' in keys:
            i['posterRatio'] = self.poster_width / self.poster_height


        streams = self.streams()
        i['durations'] = [s.duration for s in streams]
        i['duration'] = sum(i['durations'])
        if not streams:
            i['duration'] = self.files.filter(
                Q(selected=True)|Q(wanted=True)
            ).aggregate(Sum('duration'))['duration__sum'] 
        i['parts'] = len(i['durations'])
        if i['parts']:
            i['videoRatio'] = streams[0].aspect_ratio
            i['resolution'] = (streams[0].file.width, streams[0].file.height)

        #only needed by admins
        if keys and 'posters' in keys:
            i['posters'] = self.get_posters()

        frames = self.get_frames()
        if keys and 'frames' in keys:
            i['frames'] = frames

        selected_frame = filter(lambda f: f['selected'], frames)
        if selected_frame:
            i['posterFrame'] = selected_frame[0]['position']
        elif self.poster_frame != -1.0:
            i['posterFrame'] = self.poster_frame

        dkeys = [k['id'] for k in
                filter(lambda i: i.get('description'), settings.CONFIG['itemKeys'])]
        if keys:
            dkeys = filter(lambda k: k in keys, dkeys)
        for key in dkeys:
            k = filter(lambda i: i['id'] == key, settings.CONFIG['itemKeys'])
            if isinstance((k and k[0].get('type') or ''), list):
                i['%sdescription'%key] = {}
                if key == 'name':
                    values = []
                    for ikey in filter(lambda i: i.get('sortType') == 'person',
                            settings.CONFIG['itemKeys']):
                        values += i.get(ikey['id'], [])
                    values = list(set(values))
                else:
                    values = self.get(key)
                if values:
                    for d in Description.objects.filter(key=key, value__in=values):
                        i['%sdescription'%key][d.value] = d.description
            else:
                qs = Description.objects.filter(key=key, value=self.get(key, ''))
                i['%sdescription'%key] = '' if qs.count() == 0 else qs[0].description
        if keys:
            info = {}
            for key in keys:
                if key in i:
                    info[key] = i[key]
            return info
        return i

    def get_item_description(self):
        if settings.USE_IMDB:
            info = tuple([self.data.get(k, 0) for k in ['hue', 'saturation', 'lightness']])
            description = 'Hue: %.3f, Saturation: %.3f, Lightness: %.3f' % info
        else:
            description = ox.strip_tags(self.get('summary', ''))
        return description

    def oxdb_id(self):
        if not self.get('title') and not self.get('director'):
            return self.itemId
        return ox.get_oxid(self.get('seriesTitle', self.get('title', '')),
                           self.get('director', []),
                           self.get('seriesYear', self.get('year', '')),
                           self.get('season', ''),
                           self.get('episode', ''),
                           self.get('episodeTitle', ''),
                           self.get('episodeDirector', []),
                           self.get('episodeYear', ''))

    '''
        Search related functions
    '''

    def update_find(self):

        def save(key, value):
            if value not in ('', None):
                f, created = ItemFind.objects.get_or_create(item=self, key=key)
                if isinstance(value, bool):
                    value = value and 'true' or 'false'
                if isinstance(value, basestring):
                    value = ox.decode_html(ox.strip_tags(value.strip()))
                    value = unicodedata.normalize('NFKD', value).lower()
                f.value = value
                f.save()
            else:
                ItemFind.objects.filter(item=self, key=key).delete()

        with transaction.commit_on_success():
            for key in settings.CONFIG['itemKeys']:
                i = key['id']
                if i == 'title':
                    titles = [self.get('title', 'Untitled')]
                    if self.get('originalTitle'):
                        titles.append(self.get('originalTitle'))
                    at = self.get('alternativeTitles')
                    if at:
                        titles += [a[0] for a in at]
                    save(i, u'\n'.join(titles))
                elif i == 'rightslevel':
                    save(i, self.level)
                elif i == 'filename':
                    save(i, '\n'.join(self.all_paths()))
                elif i == 'annotations':
                    qs = Annotation.objects.filter(item=self)
                    qs = qs.filter(layer__in=Annotation.public_layers()).exclude(findvalue=None)
                    qs = qs.order_by('start')
                    save(i, u'\n'.join([l.findvalue for l in qs]))
                elif key['type'] == 'layer':
                    qs = Annotation.objects.filter(item=self).exclude(findvalue=None)
                    qs = qs.filter(layer=i)
                    qs = qs.order_by('start')
                    save(i, u'\n'.join(filter(None, [l.findvalue for l in qs])))
                elif i != '*' and i not in self.facet_keys:
                    value = self.get(i)
                    if isinstance(value, list):
                        value = u'\n'.join(value)
                    save(i, value)

            for key in self.facet_keys:
                if key == 'character':
                    values = self.get('cast', '')
                    if values:
                        values = filter(lambda x: x.strip(),
                                        [f['character'] for f in values])
                        values = list(set(values))
                elif key == 'name':
                    values = []
                    for k in map(lambda x: x['id'],
                                   filter(lambda x: x.get('sortType') == 'person',
                                          settings.CONFIG['itemKeys'])):
                        values += self.get(k, [])
                    values = list(set(values))
                else:
                    values = self.get(key, '')
                if isinstance(values, list):
                    save(key, '\n'.join(values))
                else:
                    save(key, values)

            isSeries = self.get('series',
                                self.get('episodeTitle',
                                self.get('episode',
                                self.get('seriesTitle')))) != None
            save('series', isSeries)

    def update_sort(self):
        try:
            s = self.sort
        except ItemSort.DoesNotExist:
            s = ItemSort(item=self)

        def sortNames(values):
            sort_value = u''
            if values:
                sort_value = u'; '.join([get_name_sort(name) for name in values])
            if not sort_value:
                sort_value = u''
            return sort_value

        def set_value(s, name, value):
            if not value:
                value = None
            if isinstance(value, basestring):
                value = ox.decode_html(value.lower())
            setattr(s, name, value)

        base_keys = (
            'aspectratio',
            'bitrate',
            'clips',
            'created',
            'cutsperminute',
            'duration',
            'hue',
            'id',
            'oxdbId',
            'lightness',
            'modified',
            'numberofannotations',
            'numberofcuts',
            'numberoffiles',
            'parts',
            'pixels',
            'random',
            'timesaccessed',
            'accessed',
            'resolution',
            'width',
            'height',
            'rendered',
            'rightslevel',
            'saturation',
            'size',
            'volume',
            'words',
            'wordsperminute',
        )

        for key in filter(lambda k: k.get('sort', False), settings.CONFIG['itemKeys']):
            name = key['id']
            source = name
            sort_type = key.get('sortType', key['type'])
            if 'value' in key:
                if 'layer' in key['value']:
                   continue
                source = key['value']['key']
                sort_type = key['value'].get('type', sort_type)
            if isinstance(sort_type, list):
                sort_type = sort_type[0]

            if name not in base_keys:
                if sort_type == 'title':
                    value = get_title_sort(self.get(source, u'Untitled'))
                    value = utils.sort_title(value)[:955]
                    set_value(s, name, value)
                elif sort_type == 'person':
                    value = sortNames(self.get(source, []))
                    value = utils.sort_string(value)[:955]
                    set_value(s, name, value)
                elif sort_type == 'string':
                    value = self.get(source, u'')
                    if isinstance(value, list):
                        value = u','.join(value)
                    value = utils.sort_string(value)[:955]
                    set_value(s, name, value)
                elif sort_type in ('length', 'integer', 'float'):
                    #can be length of strings or length of arrays, i.e. keywords
                    value = self.get(source)
                    if isinstance(value, list):
                        value = len(value)
                    set_value(s, name, value)
                elif sort_type == 'words':
                    value = self.get(source)
                    if isinstance(value, list):
                        value = '\n'.join(value)
                    if value:
                        value = len(value.split(' '))
                    set_value(s, name, value)
                elif sort_type == 'year':
                    value = self.get(source)
                    set_value(s, name, value)
                elif sort_type == 'date':
                    value = self.get(source)
                    if isinstance(value, basestring):
                        value = datetime_safe.datetime.strptime(value, '%Y-%m-%d')
                    set_value(s, name, value)

        #sort keys based on database, these will always be available
        s.itemId = self.itemId.replace('0x', 'xx')
        s.oxdbId = self.oxdbId
        if not settings.USE_IMDB:
            s.itemId = ox.sort_string(str(ox.fromAZ(s.itemId)))
        s.modified = self.modified or datetime.now()
        s.created = self.created or datetime.now()
        s.rightslevel = self.level

        s.aspectratio = self.get('aspectratio')
        if self.id:
            s.words = sum([len(a.value.split()) for a in self.annotations.exclude(value='')])
            s.clips = self.clips.count()

        s.numberoffiles = self.files.all().count()
        videos = self.files.filter(selected=True).filter(Q(is_video=True)|Q(is_audio=True))
        if videos.count() > 0:
            #s.duration = sum([v.duration for v in videos])
            s.duration = sum([v.duration for v in self.streams()])
            v = videos[0]
            if v.is_audio:
                s.resolution = None
                s.width = None
                s.height = None
            else:
                s.resolution = v.width * v.height
                s.width = v.width
                s.height = v.height
            if not s.aspectratio and v.display_aspect_ratio:
                s.aspectratio = float(utils.parse_decimal(v.display_aspect_ratio))
            s.pixels = sum([v.pixels for v in videos])
            s.parts = videos.count()
            s.size = sum([v.size for v in videos]) #FIXME: only size of movies?
            if s.duration:
                s.bitrate = s.size * 8 / s.duration
            else:
                s.bitrate = 0
            s.volume = self.data.get('volume', None)
        else:
            s.duration = None
            s.resolution = None
            s.bitrate = None
            s.pixels = None
            s.filename = None
            s.files = None
            s.size = None
            s.volume = None
            s.parts = 0

        for key in ('hue', 'saturation', 'lightness'):
            if key in self.data:
                setattr(s, key, self.data.get(key, None))
        s.numberofannotations = self.annotations.all().count()
        s.numberofcuts = len(self.data.get('cuts', []))
        if s.duration:
            s.cutsperminute = s.numberofcuts / (s.duration/60)
            s.wordsperminute = s.words / (s.duration / 60)
        else:
            s.cutsperminute = None
            s.wordsperminute = None
        s.timesaccessed = self.accessed.aggregate(Sum('accessed'))['accessed__sum']
        if not s.timesaccessed:
            s.timesaccessed = 0
        s.accessed = self.accessed.aggregate(Max('access'))['access__max']
        s.save()

    def update_layer_facet(self, key):
        current_values = [a['value']
            for a in self.annotations.filter(layer=key).distinct().values('value')]
        current_values = [ox.decode_html(v) for v in current_values]
        saved_values = [i.value for i in Facet.objects.filter(item=self, key=key)]
        removed_values = filter(lambda i: i not in current_values, saved_values)
        if removed_values:
            Facet.objects.filter(item=self, key=key, value__in=removed_values).delete()
        for value in current_values:
            if value not in saved_values:
                sortvalue = utils.sort_string(value).lower()[:900]
                Facet.objects.get_or_create(item=self, key=key, value=value, sortvalue=sortvalue)

    def update_layer_facets(self):
        for k in settings.CONFIG['itemKeys']:
            if k.get('filter') and k['type'] == 'layer':
                self.update_layer_facet(k['id'])

    def update_facets(self):
        for key in self.facet_keys + ['title']:
            current_values = self.get(key, [])
            if key == 'title':
                if current_values:
                    current_values = [current_values]
                else:
                    current_values = []
                ot = self.get('originalTitle')
                if ot:
                    current_values.append(ot)
                at = self.get('alternativeTitles')
                if at:
                    current_values += [a[0] for a in at]
            elif key == 'character':
                current_values = filter(lambda x: x.strip(),
                                        [f['character'] for f in self.get('cast', [])])
                current_values = [item for sublist in [x.split(' / ') for x in current_values]
                                  for item in sublist]
            elif key == 'name':
                current_values = []
                #FIXME: is there a better way to build name collection?
                for k in map(lambda x: x['id'],
                               filter(lambda x: x.get('sortType') == 'person',
                                      settings.CONFIG['itemKeys'])):
                    current_values += self.get(k, [])
            if not isinstance(current_values, list):
                if not current_values:
                    current_values = []
                else:
                    current_values = [unicode(current_values)]
            current_values = list(set(current_values))
            current_values = [ox.decode_html(v) for v in current_values]
            saved_values = [i.value for i in Facet.objects.filter(item=self, key=key)]
            removed_values = filter(lambda i: i not in current_values, saved_values)
            if removed_values:
                Facet.objects.filter(item=self, key=key, value__in=removed_values).delete()
            for value in current_values:
                if value not in saved_values:
                    sortvalue = value
                    if key in self.person_keys + ['name']:
                        sortvalue = get_name_sort(value)
                    sortvalue = utils.sort_string(sortvalue).lower()[:900]
                    Facet.objects.get_or_create(item=self, key=key, value=value, sortvalue=sortvalue)
        self.update_layer_facets()

    def path(self, name=''):
        h = self.itemId
        h = (7-len(h))*'0' + h
        return os.path.join('items', h[:2], h[2:4], h[4:6], h[6:], name)

    '''
        Video related functions
    '''
    def frame(self, position, height=None):
        offset = 0
        streams = self.streams()
        for stream in streams:
            if stream.duration + offset < position:
                offset += stream.duration
            else:
                position = position - offset
                if not height:
                    height = stream.resolution
                else:
                    height = min(height, stream.resolution)
                path = os.path.join(settings.MEDIA_ROOT, stream.path(),
                                    'frames', "%dp"%height, "%s.jpg"%position)
                if not os.path.exists(path) and stream.media:
                    extract.frame(stream.media.path, path, position, height)
                if not os.path.exists(path):
                    return None
                return path

    @property
    def timeline_prefix(self):
        videos = self.streams()
        if len(videos) == 1:
            return os.path.join(settings.MEDIA_ROOT, videos[0].path(''))
        return os.path.join(settings.MEDIA_ROOT, self.path())

    def all_paths(self):
        return list(set([
            item for sublist in
            [f.all_paths() for f in self.files.all()]
            for item in sublist
        ]))

    def get_files(self, user):
        files = self.files.all().select_related()
        if user.get_profile().get_level() != 'admin':
            files = files.filter(instances__volume__user=user)
        return [f.json() for f in files]

    def users_with_files(self):
        return User.objects.filter(
            volumes__files__file__item=self
        ).order_by('-profile__level', 'date_joined').distinct()

    def sets(self):
        sets = []
        for user in self.users_with_files():
            files = self.files.filter(instances__volume__user=user, instances__ignore=False)
            if files.count():
                sets.append(files)
        if not sets:
            files = self.files.filter(instances=None, available=True)
            if files.count():
                sets.append(files)
        return sets

    def update_wanted(self):
        wanted = []
        for s in self.sets():
            if s.filter(selected=False).count() != 0:
                wanted += [i.id for i in s]
            else:
                break
        self.files.filter(id__in=wanted).update(wanted=True)
        self.files.exclude(id__in=wanted).update(wanted=False)

    def update_selected(self):
        sets = self.sets()
        for s in sets:
            if s.filter(Q(is_video=True)|Q(is_audio=True)).filter(available=False).count() == 0:
                update = False
                self.files.exclude(id__in=s).exclude(part=None).update(part=None)
                deselect = self.files.filter(selected=True).exclude(id__in=s)
                if deselect.count() > 0:
                    deselect.update(selected=False)
                    update = True
                if s.filter(selected=False).count() > 0:
                    s.update(selected=True, wanted=False)
                    update = True
                if update:
                    self.rendered = False
                    self.save()
                    tasks.update_timeline.delay(self.itemId)
                break
        if not sets:
            self.rendered = False
            self.files.filter(selected=True).update(selected=False)
            self.save()

    def get_torrent(self, request):
        if self.torrent:
            self.torrent.seek(0)
            data = ox.torrent.bdecode(self.torrent.read())
            url = request.build_absolute_uri("%s/torrent/"%self.get_absolute_url())
            if url.startswith('https://'):
                url = 'http' + url[5:]
            data['url-list'] = ['%s%s' % (url, u.split('torrent/')[1]) for u in data['url-list']]
            return ox.torrent.bencode(data)

    def make_torrent(self):
        streams = self.streams()
        if streams.count() == 0:
            return
        base = self.path('torrent')
        base = os.path.abspath(os.path.join(settings.MEDIA_ROOT, base))
        if isinstance(base, unicode):
            base = base.encode('utf-8')
        if os.path.exists(base):
            shutil.rmtree(base)
        ox.makedirs(base)

        filename = utils.safe_filename(self.get('title'))
        base = self.path('torrent/%s' % filename)
        base = os.path.abspath(os.path.join(settings.MEDIA_ROOT, base))
        size = 0
        duration = 0.0
        if streams.count() == 1:
            url =  "%s/torrent/%s.webm" % (self.get_absolute_url(),
                                           quote(filename.encode('utf-8')))
            video = "%s.webm" % base
            v = streams[0]
            os.symlink(v.media.path, video)
            size = v.media.size
            duration = v.duration
        else:
            url =  "%s/torrent/" % self.get_absolute_url()
            part = 1
            os.makedirs(base)
            for v in streams:
                video = "%s/%s.Part %d.webm" % (base, filename, part)
                part += 1
                os.symlink(v.media.path, video)
                size += v.media.size
                duration += v.duration
            video = base

        torrent = '%s.torrent' % base
        url = "http://%s%s" % (settings.CONFIG['site']['url'], url)
        meta = {
            'target': torrent,
            'url-list': url,
        }
        if duration:
            meta['playtime'] = ox.format_duration(duration*1000)[:-4]

        #slightly bigger torrent file but better for streaming
        piece_size_pow2 = 15 #1 mbps -> 32KB pieces
        if size / duration >= 1000000:
            piece_size_pow2 = 16 #2 mbps -> 64KB pieces
        meta['piece_size_pow2'] = piece_size_pow2

        ox.torrent.create_torrent(video, settings.TRACKER_URL, meta)
        self.torrent.name = torrent[len(settings.MEDIA_ROOT)+1:]
        self.save()

    def streams(self):
        return archive.models.Stream.objects.filter(
            source=None, available=True, file__item=self, file__selected=True
        ).filter(
            Q(file__is_audio=True)|Q(file__is_video=True)
        ).order_by('file__part', 'file__sort_path')

    def update_timeline(self, force=False, async=True):
        streams = self.streams()
        self.make_timeline()
        if streams.count() == 1:
            self.data['hue'], self.data['saturation'], self.data['lightness'] = streams[0].color
            self.data['cuts'] = streams[0].cuts
            self.data['volume'] = streams[0].volume
        else:
            self.data['cuts'] = extract.cuts(self.timeline_prefix)
            self.data['volume'] = 0
            offset = 0
            color = [0, 0, 0]
            n = streams.count()
            for s in streams:
                self.data['volume'] += s.volume * s.duration
                color = map(lambda a,b: (a+b)/n, color,ox.image.getRGB(s.color))
                offset += s.duration
            self.data['hue'], self.data['saturation'], self.data['lightness'] = ox.image.getHSL(color)
            if offset:
                self.data['volume'] /= offset
        #extract.timeline_strip(self, self.data['cuts'], stream.info, self.timeline_prefix[:-8])
        self.json = self.get_json()
        self.update_sort()
        self.select_frame()
        self.make_poster(True)
        self.make_icon()
        self.make_torrent()
        self.rendered = streams.count() > 0
        self.save()
        if self.rendered:
            if async:
                get_sequences.delay(self.itemId)
            else:
                get_sequences(self.itemId)

    def save_poster(self, data):
        self.poster.name = self.path('poster.jpg')
        poster = self.poster.path
        with open(poster, 'w') as f:
            f.write(data)

    def prefered_poster_url(self):
        external_posters = self.external_data.get('posters', {})
        service = self.poster_source
        if service and service != settings.URL and service in external_posters:
            return external_posters[service][0]['url']
        if not service:
            for service in settings.POSTER_PRECEDENCE:
                if service in external_posters:
                    return external_posters[service][0]['url']
        return None

    def make_timeline(self):
        streams = self.streams()
        if streams.count() > 1:
            timelines = [s.timeline_prefix for s in self.streams()]
            join_tiles(timelines, self.timeline_prefix)
        else:
            #remove joined timeline if it was created at some point
            for f in glob(os.path.join(settings.MEDIA_ROOT, self.path(), 'timeline*.jpg')):
                os.unlink(f)

    def make_poster(self, force=False):
        ox.makedirs(os.path.join(settings.MEDIA_ROOT,self.path()))
        if not self.poster or force:
            poster = self.make_siteposter()
            url = self.prefered_poster_url()
            if url:
                data = ox.net.read_url(url)
                self.save_poster(data)
            elif os.path.exists(poster):
                with open(poster) as f:
                    data = f.read()
                    if data:
                        self.save_poster(data)
            poster = self.path('poster.jpg')
            poster = os.path.abspath(os.path.join(settings.MEDIA_ROOT, poster))
            for f in glob(poster.replace('.jpg', '*.jpg')):
                if f != poster:
                    try:
                        os.unlink(f)
                    except OSError:
                        pass

    def make_siteposter(self):
        poster = self.path('siteposter.jpg')
        poster = os.path.abspath(os.path.join(settings.MEDIA_ROOT, poster))

        frame = self.get_poster_frame_path()
        timeline = '%stimelineantialias64p.jpg' % self.timeline_prefix

        cmd = [settings.ITEM_POSTER,
               '-d', '-',
               '-p', poster
              ]
        data = self.json.copy()
        if frame:
            data['frame'] = frame
        if os.path.exists(timeline):
            data['timeline'] = timeline
        data['oxdbId'] = self.oxdbId or self.oxdb_id() or self.itemId
        ox.makedirs(os.path.join(settings.MEDIA_ROOT,self.path()))
        p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        p.communicate(json.dumps(data, default=fields.to_json))
        for f in glob(poster.replace('.jpg', '*.jpg')):
            if f != poster:
                os.unlink(f)
        return poster

    def poster_frames(self):
        frames = []
        if settings.CONFIG['media']['importFrames']:
            offset = 0
            for f in self.files.filter(selected=True, is_video=True).order_by('sort_path'):
                for ff in f.frames.all().order_by('position'):
                    frames.append({
                        'position': offset + ff.position,
                        'path': ff.frame.path,
                        'width': ff.frame.width,
                        'height': ff.frame.height
                    })
                offset += f.duration
        else:
            if 'videoRatio' in self.json:
                width, height = self.json['resolution']
                pos = self.sort.duration / 2
                for p in map(int, [pos/2, pos, pos+pos/2]):
                    path = self.frame(p, height)
                    if path:
                        frames.append({
                            'position': p,
                            'path': path,
                            'width': width,
                            'height': height,
                        })
        return frames

    def select_frame(self):
        frames = self.poster_frames()
        if frames:
            heat = [ox.image.getImageHeat(f['path']) for f in frames]
            self.poster_frame = heat.index(max(heat))
            if not settings.CONFIG['media']['importFrames']:
                self.poster_frame = frames[self.poster_frame]['position']

    def get_poster_frame_path(self):
        path = None
        frames = self.poster_frames()
        if frames and self.poster_frame < 0:
            self.select_frame()
        if self.poster_frame >= 0:
            if settings.CONFIG['media']['importFrames']:
                if frames and len(frames) > int(self.poster_frame):
                    path = frames[int(self.poster_frame)]['path']
                elif frames:
                    path = frames[int(len(frames)/2)]['path']
            else:
                size = max(settings.CONFIG['video']['resolutions'])
                path = self.frame(self.poster_frame, size)

        return path

    def make_icon(self):
        frame = self.get_poster_frame_path()
        icon = self.path('icon.jpg')
        self.icon.name = icon
        timeline = '%stimelineantialias64p.jpg' % self.timeline_prefix
        audio_timeline = '%stimelineaudio64p.jpg' % self.timeline_prefix
        if not os.path.exists(timeline) and os.path.exists(audio_timeline):
            timeline = audio_timeline
        cmd = [settings.ITEM_ICON,
           '-i', self.icon.path
        ]
        if os.path.exists(timeline):
           cmd += ['-l', timeline]
        if frame:
           cmd += ['-f', frame]
        p = subprocess.Popen(cmd)
        p.wait()
        #remove cached versions
        icon = os.path.abspath(os.path.join(settings.MEDIA_ROOT, icon))
        for f in glob(icon.replace('.jpg', '*.jpg')):
            if f != icon:
                try:
                    os.unlink(f)
                except OSError:
                    pass
        return icon

    def load_subtitles(self, force=False):
        subtitles = utils.get_by_key(settings.CONFIG['layers'], 'isSubtitles', True)
        if not subtitles:
            return
        # only import on 0xdb for now or if forced manually
        # since this will remove all existing subtitles
        if not settings.USE_IMDB and not force:
            return False
        with transaction.commit_on_success():
            layer = subtitles['id']
            Annotation.objects.filter(layer=layer,item=self).delete()
            offset = 0
            language = ''
            subtitles = self.files.filter(selected=True, is_subtitle=True, available=True)
            languages = [f.language for f in subtitles]
            if languages:
                if 'en' in languages:
                    language = 'en'
                elif '' in languages:
                    language = ''
                else:
                    language = languages[0]

            #loop over all videos
            for f in self.files.filter(Q(is_audio=True)|Q(is_video=True)) \
                               .filter(selected=True).order_by('sort_path'):
                subtitles_added = False
                prefix = os.path.splitext(f.path)[0]
                if f.instances.all().count() > 0:
                    user = f.instances.all()[0].volume.user
                else:
                    #FIXME: allow annotations from no user instead?
                    user = User.objects.all().order_by('id')[0]
                #if there is a subtitle with the same prefix, import
                q = subtitles.filter(path__startswith=prefix,
                                     language=language)
                if q.count() == 1:
                    s = q[0]
                    for data in s.srt(offset):
                        subtitles_added = True
                        value = data['value'].replace('\n', '<br>\n').replace('<br><br>\n', '<br>\n')
                        annotation = Annotation(
                            item=self,
                            layer=layer,
                            start=float('%0.03f'%data['in']),
                            end=float('%0.03f'%data['out']),
                            value=value,
                            user=user
                        )
                        annotation.save()
                #otherwise add empty 5 seconds annotation every minute
                if not subtitles_added:
                    start = offset and int (offset / 60) * 60 + 60 or 0
                    for i in range(start,
                                   int(offset + f.duration) - 5,
                                   60):
                        annotation = Annotation(
                            item=self,
                            layer=layer,
                            start=i,
                            end=i + 5,
                            value='',
                            user=user
                        )
                        annotation.save()
                offset += f.duration
            #remove left over clips without annotations
            Clip.objects.filter(item=self, annotations__id=None).delete()
        return True

    def srt(self, layer):
        def format_value(value):
            value = value.replace('<br/>', '<br>').replace('<br>\n', '\n').replace('<br>', '\n')
            value = value.replace('\n\n', '<br>\n')
            return value
        return ox.srt.encode([{
            'in': a.start,
            'out': a.end,
            'value': format_value(a.value)
        } for a in self.annotations.filter(layer=layer).order_by('start', 'end', 'sortvalue')])

def delete_item(sender, **kwargs):
    i = kwargs['instance']
    i.delete_files()
pre_delete.connect(delete_item, sender=Item)

Item.facet_keys = []
for key in settings.CONFIG['itemKeys']:
    if 'autocomplete' in key and not 'autocompleteSortKey' in key or \
            key.get('filter'):
        Item.facet_keys.append(key['id'])

Item.person_keys = []
for key in settings.CONFIG['itemKeys']:
    if key.get('sortType') == 'person':
        Item.person_keys.append(key['id'])

class ItemFind(models.Model):
    """
        used to find items,
        item.update_find populates this table
        its used in manager.ItemManager
    """

    class Meta:
        unique_together = ("item", "key")

    item = models.ForeignKey('Item', related_name='find', db_index=True)
    key = models.CharField(max_length=200, db_index=True)
    value = models.TextField(blank=True, db_index=settings.DB_GIN_TRGM)

    def __unicode__(self):
        return u"%s=%s" % (self.key, self.value)
'''
ItemSort
table constructed based on info in settings.CONFIG['itemKeys']
'''
attrs = {
    '__module__': 'item.models',
    'item': models.OneToOneField('Item', related_name='sort', primary_key=True),
    'duration': models.FloatField(null=True, blank=True, db_index=True),
    'width': models.BigIntegerField(null=True, blank=True, db_index=True),
    'height': models.BigIntegerField(null=True, blank=True, db_index=True),
    'created': models.DateTimeField(null=True, blank=True, db_index=True),
}
for key in filter(lambda k: k.get('sort', False) or k['type'] in ('integer', 'time', 'float', 'date', 'enum'), settings.CONFIG['itemKeys']):
    name = key['id']
    name = {'id': 'itemId'}.get(name, name)
    sort_type = key.get('sortType', key['type'])
    if isinstance(sort_type, list):
        sort_type = sort_type[0]
    model = {
        'char': (models.CharField, dict(null=True, max_length=1000, db_index=True)),
        'year': (models.CharField, dict(null=True, max_length=4, db_index=True)),
        'integer': (models.BigIntegerField, dict(null=True, blank=True, db_index=True)),
        'float': (models.FloatField, dict(null=True, blank=True, db_index=True)),
        'date': (models.DateTimeField, dict(null=True, blank=True, db_index=True))
    }[{
        'string': 'char',
        'title': 'char',
        'person': 'char',
        'year': 'year',
        'words': 'integer',
        'length': 'integer',
        'date': 'date',
        'hue': 'float',
        'time': 'integer',
        'enum': 'integer',
    }.get(sort_type, sort_type)]
    if name not in attrs:
        attrs[name] = model[0](**model[1])

ItemSort = type('ItemSort', (models.Model,), attrs)
ItemSort.fields = [f.name for f in ItemSort._meta.fields]

class Access(models.Model):
    class Meta:
        unique_together = ("item", "user")

    access = models.DateTimeField(auto_now=True)
    item = models.ForeignKey(Item, related_name='accessed')
    user = models.ForeignKey(User, null=True, related_name='accessed_items')
    accessed = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        if not self.accessed:
            self.accessed = 0
        self.accessed += 1
        super(Access, self).save(*args, **kwargs)
        timesaccessed = Access.objects.filter(item=self.item).aggregate(Sum('accessed'))['accessed__sum']
        ItemSort.objects.filter(item=self.item).update(timesaccessed=timesaccessed, accessed=self.access)

    def __unicode__(self):
        if self.user:
            return u"%s/%s/%s" % (self.user, self.item, self.access)
        return u"%s/%s" % (self.item, self.access)

class Facet(models.Model):
    '''
        used for keys that can have multiple values like people, languages etc.
        does not perform to well if total number of items goes above 10k
        this happens for keywords in 0xdb right now
    '''

    class Meta:
        unique_together = ("item", "key", "value")

    item = models.ForeignKey('Item', related_name='facets')
    key = models.CharField(max_length=200, db_index=True)
    value = models.CharField(max_length=1000, db_index=True)
    sortvalue = models.CharField(max_length=1000, db_index=True)

    def __unicode__(self):
        return u"%s=%s" % (self.key, self.value)

    def save(self, *args, **kwargs):
        if not self.sortvalue:
            self.sortvalue = utils.sort_string(self.value).lower()[:900]
        super(Facet, self).save(*args, **kwargs)

class Description(models.Model):
    '''
        shared itemkey descriptions
    '''
    class Meta:
        unique_together = ("key", "value")
    key = models.CharField(max_length=200, db_index=True)
    value = models.CharField(max_length=1000, db_index=True)
    description = models.TextField()
