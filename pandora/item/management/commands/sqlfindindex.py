# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from optparse import make_option

from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.conf import settings

settings.RELOAD_CONFIG = False
import app.monkey_patch
from ... import models


class Command(BaseCommand):
    """
    print sql statement to add trigram 
    """
    help = 'sql create statements for find tables to use trigram index'
    args = ''
    option_list = BaseCommand.option_list + (
        make_option('--debug', action='store_true', dest='debug',
            default=False, help='print sql commans'),
    )

    def handle(self, **options):
        cursor = connection.cursor()
        def create_table(index, table, key):
            sql = 'CREATE INDEX "%s" ON "%s" USING gin ("%s" gin_trgm_ops)' % (index, table, key)
            if options['debug']:
                print sql
            cursor.execute(sql)

        if settings.DB_GIN_TRGM:
            table_name = models.ItemFind._meta.db_table
            indexes = connection.introspection.get_indexes(cursor, table_name)
            name = 'value'
            if name not in indexes:
                create_table("%s_%s_idx"%(table_name, name), table_name, name)
            table_name = models.Clip._meta.db_table
            cursor = connection.cursor()
            indexes = connection.introspection.get_indexes(cursor, table_name)
            name = 'findvalue'
            if name not in indexes:
                create_table("%s_%s_idx"%(table_name, name), table_name, name)
            transaction.commit_unless_managed()
