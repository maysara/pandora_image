# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

import os
from glob import glob

from django.core.management.base import BaseCommand

import app.monkey_patch
from ... import models
from ... import tasks

class Command(BaseCommand):
    """
    rebuild timeline for all items.
    """
    help = 'rebuild all timeines(use after updating oxtimelines)'
    args = ''

    def handle(self, **options):
        offset = 0
        chunk = 100
        count = models.Item.objects.count()
        while offset <= count:
            for i in models.Item.objects.all().order_by('id')[offset:offset+chunk]:
                if not os.path.exists(os.path.join(i.timeline_prefix, 'cuts.json')) or \
                   not glob('%s/timelinekeyframes16p0.jpg'%i.timeline_prefix):
                    print i.itemId
                    tasks.rebuild_timeline.delay(i.itemId)
            offset += chunk
