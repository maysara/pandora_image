# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from django.db import models

from changelog.models import Changelog

import monkey_patch

class Page(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    name = models.CharField(max_length=1024, unique=True)
    text = models.TextField(blank=True)

    def __unicode__(self):
        return self.name

    def log(self):
        c = Changelog(type='page')
        c.value = {
            'name': self.name,
            'text': self.text,
        }
        c.save()
