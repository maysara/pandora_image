# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

import re
import os
import shutil
from glob import glob
import subprocess
from urllib import quote

import ox
from ox.django.fields import TupleField
from django.conf import settings
from django.db import models, transaction
from django.db.models import Max
from django.contrib.auth.models import User

from annotation.models import Annotation
from item.models import Item

from archive import extract

import managers

class Edit(models.Model):

    class Meta:
        unique_together = ("user", "name")

    objects = managers.EditManager()

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, related_name='edits')
    name = models.CharField(max_length=255)

    status = models.CharField(max_length=20, default='private')
    _status = ['private', 'public', 'featured']
    description = models.TextField(default='')
    rightslevel = models.IntegerField(db_index=True, default=0)

    icon = models.ImageField(default=None, blank=True, null=True,
                             upload_to=lambda i, x: i.path("icon.jpg"))

    poster_frames = TupleField(default=[], editable=False)
    subscribed_users = models.ManyToManyField(User, related_name='subscribed_edits')

    def __unicode__(self):
        return u'%s (%s)' % (self.name, self.user)
    
    def get_id(self):
        return u'%s:%s' % (self.user.username, self.name)
    
    def get_absolute_url(self):
        return ('/edits/%s' % quote(self.get_id())).replace('%3A', ':')

    def add_clip(self, data, index):
        ids = [i['id'] for i in self.clips.order_by('index').values('id')]
        clip = Clip(edit=self)
        if 'annotation' in data and data['annotation']:
            clip.annotation = Annotation.objects.get(public_id=data['annotation'])
            clip.item = clip.annotation.item
        else:
            clip.item = Item.objects.get(itemId=data['item'])
            clip.start = data['in']
            clip.end = data['out']
        clip.index = index
        # dont add clip if in/out are invalid
        if not clip.annotation:
            duration = clip.item.sort.duration
            if clip.start >= clip.end or clip.start >= duration or clip.end > duration:
                return False
        clip.save()
        ids.insert(index, clip.id)
        index = 0
        with transaction.commit_on_success():
            for i in ids:
                Clip.objects.filter(id=i).update(index=index)
                index += 1
        return clip

    def accessible(self, user):
        return self.user == user or self.status in ('public', 'featured')

    def editable(self, user):
        if not user or user.is_anonymous():
            return False
        if self.user == user or \
           user.is_staff or \
           user.get_profile().capability('canEditFeaturedEdits') == True:
            return True
        return False

    def edit(self, data, user):
        for key in data:
            if key == 'status':
                value = data[key]
                if value not in self._status:
                    value = self._status[0]
                if value == 'private':
                    for user in self.subscribed_users.all():
                        self.subscribed_users.remove(user)
                    qs = Position.objects.filter(user=user,
                                                 section='section', edit=self)
                    if qs.count() > 1:
                        pos = qs[0]
                        pos.section = 'personal'
                        pos.save()
                elif value == 'featured':
                    if user.get_profile().capability('canEditFeaturedEdits'):
                        pos, created = Position.objects.get_or_create(edit=self, user=user,
                                                                             section='featured')
                        if created:
                            qs = Position.objects.filter(user=user, section='featured')
                            pos.position = qs.aggregate(Max('position'))['position__max'] + 1
                            pos.save()
                        Position.objects.filter(edit=self).exclude(id=pos.id).delete()
                    else:
                        value = self.status
                elif self.status == 'featured' and value == 'public':
                    Position.objects.filter(edit=self).delete()
                    pos, created = Position.objects.get_or_create(edit=self,
                                                  user=self.user,section='personal')
                    qs = Position.objects.filter(user=self.user,
                                                        section='personal')
                    pos.position = qs.aggregate(Max('position'))['position__max'] + 1
                    pos.save()
                    for u in self.subscribed_users.all():
                        pos, created = Position.objects.get_or_create(edit=self, user=u,
                                                                             section='public')
                        qs = Position.objects.filter(user=u, section='public')
                        pos.position = qs.aggregate(Max('position'))['position__max'] + 1
                        pos.save()

                self.status = value
            elif key == 'name':
                data['name'] = re.sub(' \[\d+\]$', '', data['name']).strip()
                if not data['name']:
                    data['name'] = "Untitled"
                name = data['name']
                num = 1
                while Edit.objects.filter(name=name, user=self.user).exclude(id=self.id).count()>0:
                    num += 1
                    name = data['name'] + ' [%d]' % num
                self.name = name
            elif key == 'description':
                self.description = ox.sanitize_html(data['description'])
            elif key == 'rightslevel':
                self.rightslevel = int(data['rightslevel'])

        if 'position' in data:
            pos, created = Position.objects.get_or_create(edit=self, user=user)
            pos.position = data['position']
            pos.section = 'featured'
            if self.status == 'private':
                pos.section = 'personal'
            pos.save()
        if 'type' in data:
            self.type = data['type'] == 'pdf' and 'pdf' or 'html'
        if 'posterFrames' in data:
            self.poster_frames = tuple(data['posterFrames'])
        self.save()
        if 'posterFrames' in data:
            self.update_icon()

    def path(self, name=''):
        h = "%07d" % self.id
        return os.path.join('edits', h[:2], h[2:4], h[4:6], h[6:], name)

    def get_items(self, user=None):
        return Item.objects.filter(editclips__id__in=self.clips.all()).distinct()

    def update_icon(self):
        frames = []
        if not self.poster_frames:
            items = self.get_items(self.user).filter(rendered=True)
            if items.count():
                poster_frames = []
                for i in range(0, items.count(), max(1, int(items.count()/4))):
                    poster_frames.append({
                        'item': items[int(i)].itemId,
                        'position': items[int(i)].poster_frame
                    })
                self.poster_frames = tuple(poster_frames)
                self.save()
        for i in self.poster_frames:
            qs = Item.objects.filter(itemId=i['item'])
            if qs.count() > 0:
                frame = qs[0].frame(i['position'])
                if frame:
                    frames.append(frame)
        self.icon.name = self.path('icon.jpg')
        icon = self.icon.path
        if frames:
            while len(frames) < 4:
                frames += frames
            folder = os.path.dirname(icon)
            ox.makedirs(folder)
            for f in glob("%s/icon*.jpg" % folder):
                os.unlink(f)
            cmd = [
                settings.LIST_ICON,
                '-f', ','.join(frames),
                '-o', icon
            ]
            p = subprocess.Popen(cmd)
            p.wait()
            self.save()

    def get_icon(self, size=16):
        path = self.path('icon%d.jpg' % size)
        path = os.path.join(settings.MEDIA_ROOT, path)
        if not os.path.exists(path):
            folder = os.path.dirname(path)
            ox.makedirs(folder)
            if self.icon and os.path.exists(self.icon.path):
                source = self.icon.path
                max_size = min(self.icon.width, self.icon.height)
            else:
                source = os.path.join(settings.STATIC_ROOT, 'jpg/list256.jpg')
                max_size = 256
            if size < max_size:
                extract.resize_image(source, path, size=size)
            else:
                path = source
        return path

    def json(self, keys=None, user=None):
        if not keys:
             keys=[
                'description',
                'editable',
                'rightslevel',
                'id',
                'items',
                'clips',
                'duration',
                'name',
                'posterFrames',
                'status',
                'subscribed',
                'user'
            ]
        response = {
            'type': 'static'
        }
        _map = {
            'posterFrames': 'poster_frames'
        }
        for key in keys:
            if key == 'id':
                response[key] = self.get_id()
            elif key == 'items':
                response[key] = self.clips.all().count()
            elif key == 'clips':
                response[key] = [c.json(user) for c in self.clips.all().order_by('index')]
            elif key == 'duration':
                if 'clips' in response:
                    clips = response['clips']
                else:
                    clips = [c.json(user) for c in self.clips.all().order_by('index')]
                response[key] = sum([c['duration'] for c in clips])
            elif key == 'editable':
                response[key] = self.editable(user)
            elif key == 'user':
                response[key] = self.user.username
            elif key == 'subscribers':
                response[key] = self.subscribed_users.all().count()
            elif key == 'subscribed':
                if user and not user.is_anonymous():
                    response[key] = self.subscribed_users.filter(id=user.id).exists()
            elif hasattr(self, _map.get(key, key)):
                response[key] = getattr(self, _map.get(key,key))
        return response

    def render(self):
        #creating a new file from clips
        tmp = tempfile.mkdtemp()
        clips = []
        for clip in self.clips.all().order_by('index'):
            data = clip.json()
            clips.append(os.path.join(tmp, '%06d.webm' % data['index']))
            cmd = ['avconv', '-i', path,
                   '-ss', data['in'], '-t', data['out'],
                   '-vcodec', 'copy', '-acodec', 'copy',
                    clips[-1]]
            #p = subprocess.Popen(cmd)
            #p.wait()
        cmd = ['mkvmerge', clips[0]] \
            + ['+'+c for c in clips[1:]] \
            + [os.path.join(tmp, 'render.webm')]
        #p = subprocess.Popen(cmd)
        #p.wait()
        shutil.rmtree(tmp)

class Clip(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    edit = models.ForeignKey(Edit, related_name='clips')
    index = models.IntegerField(default=0)
    item = models.ForeignKey(Item, null=True, default=None, related_name='editclip')
    annotation = models.ForeignKey(Annotation, null=True, default=None, related_name='editclip')
    start = models.FloatField(default=0)
    end = models.FloatField(default=0)
    duration = models.FloatField(default=0)
    
    hue = models.FloatField(default=0)
    saturation= models.FloatField(default=0)
    lightness= models.FloatField(default=0)
    volume = models.FloatField(default=0)

    def __unicode__(self):
        if self.annotation:
            return u'%s' % self.annotation.public_id
        return u'%s/%0.3f-%0.3f' % (self.item.itemId, self.start, self.end)
    
    def get_id(self):
        return ox.toAZ(self.id)
    
    def save(self, *args, **kwargs):
        if self.duration != self.end - self.start:
            self.update_calculated_values()
        super(Clip, self).save(*args, **kwargs)

    def update_calculated_values(self):
        start = self.start
        end = self.end
        self.duration = end - start
        if int(end*25) - int(start*25) > 0:
            self.hue, self.saturation, self.lightness = extract.average_color(
                           self.item.timeline_prefix, self.start, self.end)
            self.volume = extract.average_volume(self.item.timeline_prefix, self.start, self.end)
        else:
            self.hue = self.saturation = self.lightness = 0
            self.volume = 0

    def json(self, user=None):
        data = {
            'id': self.get_id(),
            'index': self.index
        }
        if self.annotation:
            data['annotation'] = self.annotation.public_id
            data['item'] = self.item.itemId
            data['in'] = self.annotation.start
            data['out'] = self.annotation.end
            data['parts'] = self.annotation.item.json['parts']
            data['durations'] = self.annotation.item.json['durations']
        else:
            data['item'] = self.item.itemId
            data['in'] = self.start
            data['out'] = self.end
            data['parts'] = self.item.json['parts']
            data['durations'] = self.item.json['durations']
        for key in ('title', 'director', 'year', 'videoRatio'):
            value = self.item.json.get(key)
            if value:
                data[key] = value
        data['duration'] = data['out'] - data['in']
        data['cuts'] = tuple([c for c in self.item.get('cuts') if c > self.start and c < self.end])
        return data

class Position(models.Model):

    class Meta:
        unique_together = ("user", "edit", "section")

    edit = models.ForeignKey(Edit, related_name='position')
    user = models.ForeignKey(User, related_name='edit_position')
    section = models.CharField(max_length='255')
    position = models.IntegerField(default=0)

    def __unicode__(self):
        return u'%s/%s/%s' % (self.section, self.position, self.edit)

