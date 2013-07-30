# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from django.db import models, transaction
from django.contrib.auth.models import User
import ox
from ox.django import fields

import managers
from annotation.models import Annotation, get_matches, get_super_matches
from item.models import Item
from changelog.models import Changelog


class Place(models.Model):
    '''
        Places are named locations, they should have geographical information attached to them.
    '''
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    defined = models.BooleanField(default=True)

    user = models.ForeignKey(User, null=True, related_name='places')

    name = models.CharField(max_length=1024)
    alternativeNames = fields.TupleField(default=[])
    name_sort = models.CharField(max_length=200, db_index=True)
    name_find = models.TextField(default='', editable=False)

    geoname = models.CharField(max_length=1024, null=True)
    geoname_sort = models.CharField(max_length=1024, null=True, db_index=True)
    countryCode = models.CharField(max_length=16, default='', db_index=True)

    wikipediaId = models.CharField(max_length=1000, blank=True)
    type = models.CharField(max_length=1000, default='', db_index=True)

    south = models.FloatField(default=None, null=True, db_index=True)
    west = models.FloatField(default=None, null=True, db_index=True)
    north = models.FloatField(default=None, null=True, db_index=True)
    east = models.FloatField(default=None, null=True, db_index=True)
    lat = models.FloatField(default=None, null=True, db_index=True)
    lng = models.FloatField(default=None, null=True, db_index=True)
    area = models.FloatField(default=None, null=True, db_index=True)

    matches = models.IntegerField(default=0, db_index=True)
    items = models.ManyToManyField(Item, blank=True, related_name='places')
    annotations = models.ManyToManyField(Annotation, blank=True, related_name='places')

    objects = managers.PlaceManager()

    class Meta:
        ordering = ('name_sort', )

    def __unicode__(self):
        return self.name

    @classmethod
    def get_or_create(model, name):
        qs = model.objects.filter(name_find__icontains=u'|%s|'%name)
        if qs.count() == 0:
            instance = model(name=name)
            instance.save()
        else:
            instance = qs[0]
        return instance

    def editable(self, user):
        if user and not user.is_anonymous() \
            and (not self.user or \
                 self.user == user or \
                 user.get_profile().capability('canEditPlaces')):
                return True
        return False

    def get_id(self):
        return ox.toAZ(self.id)

    def json(self, keys=None, user=None):
        j = {
            'id': self.get_id(),
            'editable': self.editable(user)
        }
        if self.user:
            j['user'] = self.user.username
        for key in ('created', 'modified',
                    'name', 'alternativeNames', 'geoname', 'countryCode',
                    'south', 'west', 'north', 'east',
                    'lat', 'lng', 'area', 'matches', 'type'):
            if not keys or key in keys:
                j[key] = getattr(self, key)
        return j

    def get_matches(self, qs=None):
        return get_matches(self, Place, 'place', qs)

    def get_super_matches(self):
        return get_super_matches(self, Place)

    @transaction.commit_on_success
    def update_matches(self, annotations=None):
        matches = self.get_matches(annotations)
        if not annotations:
            numberofmatches = matches.count()
            annotations = self.annotations.all()
        else:
            numberofmatches = -1
        for a in annotations.exclude(id__in=matches):
            self.annotations.remove(a)
            #annotations of type place always need a place
            if a.get_layer().get('type') == 'place' and a.places.count() == 0:
                a.places.add(Place.get_or_create(a.value))
                for p in a.places.exclude(id=self.id):
                    p.update_matches()
        for a in matches.exclude(id__in=self.annotations.all()):
            #need to check again since editEvent might have been called again
            if self.annotations.filter(id=a.id).count() == 0:
                self.annotations.add(a)
        ids = list(set([a['item_id'] for a in self.annotations.all().values('item_id')]))
        for i in self.items.exclude(id__in=ids):
            self.items.remove(i)
        for i in Item.objects.filter(id__in=ids).exclude(id__in=self.items.all()):
            if self.items.filter(id=i.id).count() == 0:
                self.items.add(i)
        if numberofmatches < 0:
            numberofmatches = self.annotations.all().count()
        if self.matches != numberofmatches:
            self.matches = numberofmatches
            if numberofmatches:
                Place.objects.filter(id=self.id).update(matches=numberofmatches)
            else:
                self.save()

    def make_undefined(self):
        self.defined = False
        self.south = None
        self.west = None
        self.north = None
        self.east = None
        self.lat = None
        self.lng = None
        self.area = None
        self.type = ''
        self.geoname = None
        self.geoname_sort = None

    def save(self, *args, **kwargs):
        if not self.name_sort:
            self.name_sort = self.name #', '.join(self.name)
        if self.geoname:
            self.geoname_sort = ', '.join(reversed(self.geoname.split(', ')))
        self.name_find = '|%s|'%'|'.join([self.name]+list(self.alternativeNames))

        self.defined = len(filter(None, [getattr(self, key)
                             for key in ('south', 'west', 'north', 'east')])) > 0

        super(Place, self).save(*args, **kwargs)

    def log(self):
        c = Changelog(type='place')
        c.value = self.json()
        c.save()
