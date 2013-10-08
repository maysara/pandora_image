# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from optparse import make_option

from django.core.management.base import BaseCommand

import app.monkey_patch
from ... import models
from ...tasks import extract_derivatives


class Command(BaseCommand):
    """
    """
    help = 'extract derivatives, run this to recreate all derivatives. i.e after adding new resolutions'
    args = ''
    option_list = BaseCommand.option_list + (
        make_option('--rebuild', action='store_true', dest='rebuild',
            default=False, help='reencode all derivatives again'),
        make_option('--forground', action='store_true', dest='forground',
            default=False, help='dont dispatch encoding to celery but run in forground'),
    )
    def handle(self, **options):
        for s in models.Stream.objects.filter(source=None):
            if options['forground']:
                extract_derivatives(s.file.id, options['rebuild'])
            else:
                extract_derivatives.delay(s.file.id, options['rebuild'])
