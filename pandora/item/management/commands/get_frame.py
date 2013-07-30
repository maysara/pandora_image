# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from django.core.management.base import BaseCommand
from django.conf import settings

settings.RELOAD_CONFIG = False
import app.monkey_patch
from ... import models

class Command(BaseCommand):
    help = 'extract frame and print path'
    args = '<id> <height> <position>'

    def handle(self, id, height, position, **options):
        position = float(position)
        i = models.Item.objects.get(itemId=id)
        path = i.frame(position, height)
        if path:
            print path
