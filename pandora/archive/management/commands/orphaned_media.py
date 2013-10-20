# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from django.core.management.base import BaseCommand
from django.conf import settings
import os
from glob import glob

import app.monkey_patch
from ... import models

class Command(BaseCommand):
    """
    """
    help = 'list files without db entry'
    args = ''

    def handle(self, **options):
        for f in glob(os.path.join(settings.MEDIA_ROOT, 'media', '*', '*', '*', '*')):
            oshash = f[-19:].replace('/', '')
            if models.File.objects.filter(oshash=oshash).count() == 0:
                print f
