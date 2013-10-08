# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement
import re
import unicodedata

from django.db import models
from django.db.models import Q
from django.contrib.auth.models import User
from django.conf import settings
from django.db.models.signals import pre_delete

import ox

from clip.models import Clip
from changelog.models import Changelog

from item.utils import sort_string, get_by_key
import managers
import utils
from tasks import update_matches


def get_super_matches(obj, model):
    super_matches = []
    q = Q(name_find__contains=" " + obj.name)|Q(name_find__contains="|%s"%obj.name)
    for name in obj.alternativeNames:
        q = q|Q(name_find__contains=" " + name)|Q(name_find__contains="|%s"%name)
    for p in model.objects.filter(q).exclude(id=obj.id):
        for othername in [p.name] + list(p.alternativeNames):
            for name in [obj.name] + list(obj.alternativeNames):
                if name in othername:
                    super_matches.append(othername)
    return super_matches

def get_matches(obj, model, layer_type, qs=None):
    super_matches = obj.get_super_matches()
    exact = [l['id'] for l in filter(lambda l: l['type'] == layer_type, settings.CONFIG['layers'])]
    if exact:
        q = Q(value__iexact=obj.name)
        for name in obj.alternativeNames:
            q = q|Q(value__iexact=name)
        f = q&Q(layer__in=exact)
    else:
        f = None

    has_type = 'has%ss' % layer_type.capitalize()
    contains = [l['id'] for l in filter(lambda l: l.get(has_type), settings.CONFIG['layers'])]
    if contains:
        name = ox.decode_html(obj.name)
        q = Q(findvalue__icontains=" " + name)|Q(findvalue__istartswith=name)
        for name in obj.alternativeNames:
            name = ox.decode_html(name)
            q = q|Q(findvalue__icontains=" " + name)|Q(findvalue__istartswith=name)
        contains_matches = q&Q(layer__in=contains)
        if f:
            f = contains_matches | f
        else:
            f = contains_matches

    matches = []
    if not qs:
        qs = Annotation.objects.all()
    for a in qs.filter(f):
        if a.findvalue:
            value = a.findvalue.lower()
            for name in super_matches:
                name = ox.decode_html(name)
                value = value.replace(name.lower(), '')
            for name in [obj.name] + list(obj.alternativeNames):
                name = name.lower()
                name = ox.decode_html(name)
                if name in value and (exact or re.compile('((^|\s)%s([\.,;:!?\-\/\s]|$))'%re.escape(name)).findall(value)):
                    matches.append(a.id)
                    break
    if not matches:
        matches = [-1]
    return Annotation.objects.filter(id__in=matches)

class Annotation(models.Model):
    objects = managers.AnnotationManager()

    #FIXME: here having a item,start index would be good
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User)
    item = models.ForeignKey('item.Item', related_name='annotations')
    clip = models.ForeignKey('clip.Clip', null=True, related_name='annotations')

    public_id = models.CharField(max_length=128, unique=True, null=True)
    #seconds
    start = models.FloatField(default=-1, db_index=True)
    end = models.FloatField(default=-1, db_index=True)

    layer = models.CharField(max_length=255, db_index=True)
    value = models.TextField()
    findvalue = models.TextField(null=True)
    sortvalue = models.CharField(max_length=1000, null=True, blank=True, db_index=True)

    def editable(self, user):
        if user.is_authenticated():
            if user.get_profile().capability('canEditAnnotations') or \
               self.user == user or \
               user.groups.filter(id__in=self.item.groups.all()).count() > 0:
                return True
        return False

    def set_public_id(self):
        if self.id:
            public_id = Annotation.objects.filter(item=self.item, id__lt=self.id).count() + 1
            if public_id > 1:
                previous = Annotation.objects.filter(item=self.item,
                    id__lt=self.id).order_by('-id')[0]
                if not previous.public_id:
                    previous.set_public_id()
                public_id = ox.fromAZ(previous.public_id.split('/')[-1]) + 1
            self.public_id = "%s/%s" % (self.item.itemId, ox.toAZ(public_id))
            Annotation.objects.filter(id=self.id).update(public_id=self.public_id)

    @classmethod
    def public_layers(self):
        layers = []
        for layer in settings.CONFIG['layers']:
            if not layer.get('private', False):
                layers.append(layer['id'])
        return layers

    def get_layer(self):
        for layer in settings.CONFIG['layers']:
            if layer['id'] == self.layer:
                return layer
        return {}

    def save(self, *args, **kwargs):
        set_public_id = not self.id or not self.public_id
        layer = self.get_layer()
        if self.value:
            self.value = utils.cleanup_value(self.value, layer['type'])
            self.findvalue = ox.decode_html(ox.strip_tags(re.sub('<br */?>\n?', ' ', self.value))).replace('\n', ' ')
            self.findvalue = unicodedata.normalize('NFKD', self.findvalue).lower()
            sortvalue = sort_string(self.findvalue)
            if sortvalue:
                self.sortvalue = sortvalue[:900]
            else:
                self.sortvalue = None
        else:
            self.findvalue = None
            self.sortvalue = None

        #no clip or update clip
        if self.layer in settings.CONFIG.get('clipLayers', []):
            if not self.clip or self.start != self.clip.start or self.end != self.clip.end:
                self.clip, created = Clip.get_or_create(self.item, self.start, self.end)
        elif self.clip:
            self.clip = None

        super(Annotation, self).save(*args, **kwargs)
        if set_public_id:
            self.set_public_id()

        if self.clip:
            Clip.objects.filter(**{
                'id': self.clip.id,
                self.layer: False
            }).update(**{self.layer: True})
            #update clip.findvalue
            self.clip.save()

        #editAnnotations needs to be in snyc
        if layer.get('type') == 'place' or layer.get('hasPlaces'):
            update_matches(self.id, 'place')
        if layer.get('type') == 'event' or layer.get('hasEvents'):
            update_matches(self.id, 'event')

    def delete(self, *args, **kwargs):
        super(Annotation, self).delete(*args, **kwargs)
        if self.clip and self.clip.annotations.count() == 0:
            self.clip.delete()
        self.item.update_find()
        self.item.update_sort()
        self.item.update_facets()

    def cleanup_undefined_relations(self):
        layer = self.get_layer()
        if layer.get('type') == 'place':
            for p in self.places.filter(defined=False):
                if p.annotations.exclude(id=self.id).count() == 0:
                    p.delete()
        elif layer.get('type') == 'event':
            for e in self.events.filter(defined=False):
                if e.annotations.exclude(id=self.id).count() == 0:
                    e.delete()

    def json(self, layer=False, keys=None, user=None):
        j = {
            'user': self.user.username,
        }
        for key in ('id', 'in', 'out', 'value', 'created', 'modified'):
            j[key] = getattr(self, {
                'hue': 'clip__hue',
                'id': 'public_id',
                'in': 'start',
                'lightness': 'clip__lightness',
                'out': 'end',
                'saturation': 'clip__saturation',
                'volume': 'clip__volume',
            }.get(key, key))
        j['duration'] = abs(j['out'] - j['in'])
        if user:
            j['editable'] = self.editable(user)

        l = self.get_layer()
        if l['type'] == 'place':
            qs = self.places.all()
            if qs.count() > 0:
                j['place'] = qs[0].json(user=user)
            else:
                j['place'] = {}
        elif l['type'] == 'event':
            qs = self.events.all()
            if qs.count() > 0:
                j['event'] = qs[0].json(user=user)
            else:
                j['event'] = {}

        if layer or (keys and 'layer' in keys):
            j['layer'] = self.layer
        if keys:
            _j = {}
            for key in keys:
                if key in j:
                    _j[key] = j[key]
            j = _j
            if 'videoRatio' in keys:
                streams = self.item.streams()
                if streams:
                    j['videoRatio'] = streams[0].aspect_ratio
        subtitles = get_by_key(settings.CONFIG['layers'], 'isSubtitles', True)
        if subtitles:
            if 'id' in j and self.layer == subtitles['id'] and not self.value:
                del j['id']
        return j

    def log(self):
        c = Changelog(type='annotation')
        c.value = self.json(layer=True)
        c.save()

    def __unicode__(self):
        return u"%s %s-%s" %(self.public_id, self.start, self.end)

def cleanup_related(sender, **kwargs):
    kwargs['instance'].cleanup_undefined_relations()
pre_delete.connect(cleanup_related, sender=Annotation)
