# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from django.core.management.base import BaseCommand

from ... import config


class Command(BaseCommand):
    """
    """
    help = 'update static files'
    args = ''

    def handle(self, **options):
        config.update_static()
