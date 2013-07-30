# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from django.db import models
from django.conf import settings

from archive import extract
import managers


class MetaClip:
    def update_calculated_values(self):
        start = self.start
        end = self.end
        if self.item.sort.duration:
            start = min(self.start, self.item.sort.duration)
            end = min(self.end, self.item.sort.duration)
        self.duration = end - start
        if int(end*25) - int(start*25) > 0:
            self.hue, self.saturation, self.lightness = extract.average_color(
                           self.item.timeline_prefix, self.start, self.end)
            self.volume = extract.average_volume(self.item.timeline_prefix, self.start, self.end)
        else:
            self.hue = self.saturation = self.lightness = 0
            self.volume = 0
  
    def save(self, *args, **kwargs):
        if self.duration != self.end - self.start:
            self.update_calculated_values()
        if not self.aspect_ratio and self.item:
            streams = self.item.streams()
            if streams:
                self.aspect_ratio = streams[0].aspect_ratio
        if self.item:
            self.user = self.item.user and self.item.user.id
            self.sort = self.item.sort
        if self.id:
            sortvalue = ''
            if self.id:
                for l in settings.CONFIG.get('clipLayers', []):
                    sortvalue += ''.join(filter(lambda s: s,
                         [a.sortvalue
                          for a in self.annotations.filter(layer=l).order_by('sortvalue')]))
            if sortvalue:
                self.sortvalue = sortvalue[:900]
            else:
                self.sortvalue = None
            self.findvalue = '\n'.join(filter(None, [a.findvalue for a in self.annotations.all()]))
            for l in settings.CONFIG['clipLayers']:
                setattr(self, l, self.annotations.filter(layer=l).count()>0)
        models.Model.save(self, *args, **kwargs)

    clip_keys = ('id', 'in', 'out', 'position', 'created', 'modified',
                 'hue', 'saturation', 'lightness', 'volume', 'videoRatio')
    def json(self, keys=None, qs=None):
        j = {}
        for key in self.clip_keys:
            j[key] = getattr(self, {
                'id': 'public_id',
                'in': 'start',
                'out': 'end',
                'position': 'start',
                'videoRatio': 'aspect_ratio',
            }.get(key, key))
        if not j['videoRatio']:
            j['videoRatio'] = 4/3
        if keys:
            for key in j.keys():
                if key not in keys:
                    del j[key]
            #needed here to make item find with clips work
            if 'annotations' in keys:
                annotations = self.annotations.filter(layer__in=settings.CONFIG['clipLayers'])
                if qs:
                    annotations = annotations.filter(qs)
                j['annotations'] = [a.json(keys=['value', 'id', 'layer'])
                                    for a in annotations]
            for key in keys:
                if key not in self.clip_keys and key not in j:
                    value = self.item.get(key) or self.item.json.get(key)
                    if not value and hasattr(self.item.sort, key):
                        value = getattr(self.item.sort, key)
                    if value != None:
                        j[key] = value
        return j

    @classmethod
    def get_or_create(cls, item, start, end):
        start = float(start)
        end = float(end)
        start = float('%0.03f' % start)
        end = float('%0.03f' % end)
        qs = cls.objects.filter(item=item, start=start, end=end)
        if qs.count() == 0:
            clip, created = cls.objects.get_or_create(item=item, start=start, end=end)
            clip.save()
            created = True
        else:
            clip = qs[0]
            created = False
        return clip, created

    @property
    def public_id(self):
        return u"%s/%0.03f-%0.03f" %(self.item.itemId, float(self.start), float(self.end))

    def __unicode__(self):
        return self.public_id

class Meta:
    unique_together = ("item", "start", "end")

attrs = {
    '__module__': 'clip.models',
    'Meta': Meta,
    'objects': managers.ClipManager(),
    'created': models.DateTimeField(auto_now_add=True),
    'modified': models.DateTimeField(auto_now=True),
    'aspect_ratio': models.FloatField(default=0),

    'item': models.ForeignKey('item.Item', related_name='clips'),
    'sort': models.ForeignKey('item.ItemSort', related_name='matching_clips'),
    'user': models.IntegerField(db_index=True, null=True),

    #seconds
    'start': models.FloatField(default=-1, db_index=True),
    'end': models.FloatField(default=-1),
    'duration': models.FloatField(default=0, db_index=True),

    
    #get from annotation
    'hue': models.FloatField(default=0, db_index=True),
    'saturation': models.FloatField(default=0, db_index=True),
    'lightness': models.FloatField(default=0, db_index=True),
    'volume': models.FloatField(default=0, null=True, db_index=True),

    'sortvalue': models.CharField(max_length=1000, null=True, db_index=True),
    'findvalue': models.TextField(null=True, db_index=settings.DB_GIN_TRGM),
}
for name in settings.CONFIG['clipLayers']:
    attrs[name] = models.BooleanField(default=False, db_index=True)

Clip = type('Clip', (MetaClip,models.Model), attrs)

class Random(models.Model):
    clip = models.ForeignKey(Clip, primary_key=True)
    random = models.BigIntegerField(db_index=True, null=True)

