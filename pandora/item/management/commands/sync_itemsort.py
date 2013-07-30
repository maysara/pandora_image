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
import clip.models

class Command(BaseCommand):
    """
    sync item sort table with current settings in site.json
    """
    help = 'alter table to match itemKeys in site.json.'
    args = ''
    option_list = BaseCommand.option_list + (
        make_option('--debug', action='store_true', dest='debug',
            default=False, help='print sql commans'),
    )

    def handle(self, **options):
        table_name = models.ItemSort._meta.db_table
        cursor = connection.cursor()
        db_rows = connection.introspection.get_table_description(cursor, table_name)
        db_fields = dict([(row[0], row) for row in db_rows])
        db_types = dict([(row[0],
                          connection.introspection.data_types_reverse[row[1]]) for row in db_rows])

        model_fields = ['item_id'] + [f.name for f in models.ItemSort._meta.fields]

        changes = []
        for name in db_types:
            if name not in model_fields:
                sql = 'ALTER TABLE "%s" DROP COLUMN "%s"' % (table_name, name)
                changes.append(sql)

        for f in models.ItemSort._meta.fields:
            if not f.primary_key:
                name = f.name
                col_type = f.db_type(connection)
                if name not in db_fields:
                    sql = 'ALTER TABLE "%s" ADD COLUMN "%s" %s' % (table_name, name, col_type)
                    changes.append(sql)
                    sql = 'CREATE INDEX "%s_%s_idx" ON "%s" ("%s")' % (table_name, name,
                                                                       table_name, name)
                    changes.append(sql)
                elif f.__class__.__name__ != db_types[name]:
                    sql = 'ALTER TABLE "%s" DROP COLUMN "%s"' % (table_name, name )
                    changes.append(sql)
                    sql = 'ALTER TABLE "%s" ADD COLUMN "%s" %s' % (table_name, name, col_type)
                    changes.append(sql)
                    sql = 'CREATE INDEX "%s_%s_idx" ON "%s" ("%s")' % (table_name, name,
                                                                       table_name, name)
                    changes.append(sql)
                elif db_types[name] == 'CharField' and db_fields[name][3] != f.max_length:
                    sql = 'ALTER TABLE "%s" ALTER COLUMN "%s" TYPE %s' % (table_name, name,
                                                                          col_type)
                    changes.append(sql)
                    sql = 'ALTER TABLE "%s" ALTER COLUMN "%s" %s NOT NULL' % (table_name, name,
                                                                    f.null and "DROP" or "SET")
                    changes.append(sql)
       
        #also update clip index
        table_name = clip.models.Clip._meta.db_table
        db_rows = connection.introspection.get_table_description(cursor, table_name)
        db_fields = dict([(row[0], row) for row in db_rows])
        db_types = dict([(row[0],
                          connection.introspection.data_types_reverse[row[1]]) for row in db_rows])
        model_fields = ['item_id', 'sort_id'] + [f.name for f in clip.models.Clip._meta.fields]

        for name in db_types:
            if name not in model_fields:
                sql = 'ALTER TABLE "%s" DROP COLUMN "%s"' % (table_name, name)
                changes.append(sql)
        for f in clip.models.Clip._meta.fields:
            if not f.primary_key and not isinstance(f, fields.related.ForeignKey):
                name = f.name
                col_type = f.db_type(connection)
                if name not in db_fields:
                    sql = 'ALTER TABLE "%s" ADD COLUMN "%s" %s' % (table_name, name, col_type)
                    changes.append(sql)
                    sql = 'UPDATE "%s" SET "%s"=FALSE WHERE "%s" IS NULL' % (
                        table_name, name, name
                    )
                    changes.append(sql)
                    sql = 'CREATE INDEX "%s_%s_idx" ON "%s" ("%s")' % (table_name, name,
                                                                       table_name, name)
                    changes.append(sql)
                    sql = 'COMMIT'
                    changes.append(sql)
                    sql = 'ALTER TABLE "%s" ALTER COLUMN "%s" SET NOT NULL' % (table_name, name)
                    changes.append(sql)
                    sql = 'BEGIN'
                    changes.append(sql)
        if changes:
            print "Database needs to be updated, plase wait..."
            for sql in changes:
                if options['debug']:
                    print sql
                cursor.execute(sql)
            transaction.commit_unless_managed()
