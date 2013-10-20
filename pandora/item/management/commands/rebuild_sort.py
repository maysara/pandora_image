# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from optparse import make_option

from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.db.models import fields
from django.conf import settings

settings.RELOAD_CONFIG = False
import app.monkey_patch
from ... import models

class Command(BaseCommand):
    help = 'update sort values, run after changing sort keys'
    args = ''
    option_list = BaseCommand.option_list + (
        make_option('--debug', action='store_true', dest='debug',
            default=False, help='print sql commans'),
    )

    def handle(self, **options):
        ids = [i['id'] for i in models.Item.objects.all().values('id')]
        for id in ids:
            try:
                i = models.Item.objects.get(pk=id)
                if options['debug']:
                    print i
                i.update_sort()
            except:
                pass
