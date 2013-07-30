# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement
from django.db import models
from ox.django import fields

class Changelog(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=255, db_index=True)
    value = fields.DictField(default={})

    def __unicode__(self):
        return u'%s %s' %(self.type, self.created)
