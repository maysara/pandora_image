# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from django.core.management.base import BaseCommand
from django.conf import settings
import os

import app.monkey_patch
from ... import models
from ...tasks import update_stream


class Command(BaseCommand):
    """
    """
    help = 'update static files'
    args = ''

    def handle(self, **options):
        for root, folders, files in os.walk(os.path.join(settings.MEDIA_ROOT, 'files')):
            for f in files:
                f = os.path.join(root, f)
                profile, ext = os.path.splitext(os.path.basename(f))
                if ext in ('.webm', '.mp4'):
                    oshash = os.path.dirname(f)[-19:].replace('/', '')
                    format = ext[1:]
                    if profile.endswith('p'):
                        profile = profile[:-1]
                    resolution = int(profile)
                    qs = models.Stream.objects.filter(file__oshash=oshash, format=format, resolution=resolution)
                    if qs.count() == 0:
                        print 'add', f
                        print oshash, resolution, format
                        qs = models.File.objects.filter(oshash=oshash)
                        if qs.count() == 1:
                            stream = models.Stream()
                            stream.file = qs[0]
                            stream.resolution = resolution
                            stream.format = format
                            stream.video.name = f[len(settings.MEDIA_ROOT)+1:]
                            stream.available = True
                            stream.save()
                            if not stream.file.info:
                                stream.file.info = stream.info
                                stream.file.save()
        #link streams
        resolution = max(settings.CONFIG['video']['resolutions'])
        format = settings.CONFIG['video']['formats'][0]
        for s in models.Stream.objects.exclude(format=format, resolution=resolution).filter(source=None):
            s.source = models.Stream.objects.get(file=s.file, resolution=resolution, format=format)
            s.save()
        print "update streams"
        for s in models.Stream.objects.filter(source=None):
            update_stream.delay(s.id)
