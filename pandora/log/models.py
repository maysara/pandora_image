# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from django.db import models
from django.contrib.auth.models import User
import ox

import managers

class Log(models.Model):
    created = models.DateTimeField(auto_now_add=True, db_index=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, default=None, blank=True, null=True)
    url = models.CharField(max_length=1000, default='')
    line = models.IntegerField(default=0)
    text = models.TextField(blank=True)

    objects = managers.LogManager()

    def __unicode__(self):
        return u"%s" % self.id

    def json(self, keys=None):
        j = {
            'created': self.created,
            'id': ox.toAZ(self.id),
            'line': self.line,
            'modified': self.modified,
            'text': self.text,
            'url': self.url,
            'user': self.user and self.user.username or '',
        }
        if keys:
            for key in j.keys():
                if key not in keys:
                    del j[key]
        return j

