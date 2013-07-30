# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

import unicodedata

from django.db import models

import ox

from item import utils

import managers

def get_title_sort(title):
    if isinstance(title, str):
        title = unicode(title)
    title = unicodedata.normalize('NFKD', title).strip()
    if title:
        title, created = Title.objects.get_or_create(title=title)
        if created:
            title.save()
        sorttitle = unicodedata.normalize('NFKD', title.sorttitle)
    else:
        sorttitle = u''
    return sorttitle

class Title(models.Model):
    title = models.CharField(max_length=1000, unique=True)
    sorttitle = models.CharField(max_length=1000)
    sortsorttitle = models.CharField(max_length=1000)
    edited = models.BooleanField(default=False)

    imdbId = models.CharField(max_length=7, blank=True)

    objects = managers.TitleManager()

    def __unicode__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.sorttitle:
            self.sorttitle = ox.get_sort_title(self.title)
            self.sorttitle = unicodedata.normalize('NFKD', self.sorttitle)
        self.sortsorttitle = utils.sort_title(self.sorttitle)
        super(Title, self).save(*args, **kwargs)

    def get_or_create(model, title, imdbId=None):
        if imdbId:
            q = model.objects.filter(title=title, imdbId=imdbId)
        else:
            q = model.objects.all().filter(title=title)
        if q.count() > 0:
            o = q[0]
        else:
            o = model.objects.create(title=title)
            if imdbId:
                o.imdbId = imdbId
            o.save()
        return o
    get_or_create = classmethod(get_or_create)

    def get_id(self):
        return ox.toAZ(self.id)

    def json(self, keys=None, user=None):
        j = {
            'id': self.get_id(),
            'title': self.title,
            'sorttitle': self.sorttitle,
        }
        if keys:
            for key in j.keys():
                if key not in keys:
                    del j[key]
        return j

def update_sort_title():
    for t in Title.objects.all():
        _sorttitle = ox.get_sort_title(t.title)
        _sorttitle = unicodedata.normalize('NFKD', _sorttitle)
        if (not t.edited and _sorttitle != t.sorttitle) or \
           (t.edited and _sorttitle == t.sorttitle):
            t.sorttitle = _sorttitle
            t.edited = False
            t.save()
