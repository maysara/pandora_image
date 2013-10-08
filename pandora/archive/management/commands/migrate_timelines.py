# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import os
import re

from django.core.management.base import BaseCommand
from django.conf import settings
import app.monkey_patch
from ... import models


class Command(BaseCommand):
    """
    """
    help = 'migrate timelines to new path'
    args = ''

    def handle(self, **options):
        for root, folders, files in os.walk(settings.MEDIA_ROOT):
            for f in files:
                f = os.path.join(root, f)
                base, ext = os.path.splitext(os.path.basename(f))
                if base.startswith('timeline') and ext == '.png':
                    if base in ('timeline.overview', 'timeline.overview.8'):
                        print 'delete', f
                        os.unlink(f)
                    else:
                        n = re.compile('timeline(\d+)p(\d+)').findall(base)
                        if not n:
                            n = re.compile('timeline(\d+)p').findall(base)
                            target = 'timelineantialias%sp.jpg' % n[0]
                            print f, target
                            target = os.path.join(os.path.dirname(f), target)
                            os.rename(f, target)
                        else:
                            n = tuple(map(int, n[0]))
                            target = 'timelineantialias%dp%d.jpg' % n
                            print f, target
                            target = os.path.join(os.path.dirname(f), target)
                            os.rename(f, target)
