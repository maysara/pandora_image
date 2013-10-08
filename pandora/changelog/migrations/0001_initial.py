# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Changelog'
        db.create_table('changelog_changelog', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=255, db_index=True)),
            ('value', self.gf('ox.django.fields.DictField')(default={})),
        ))
        db.send_create_signal('changelog', ['Changelog'])


    def backwards(self, orm):
        # Deleting model 'Changelog'
        db.delete_table('changelog_changelog')


    models = {
        'changelog.changelog': {
            'Meta': {'object_name': 'Changelog'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '255', 'db_index': 'True'}),
            'value': ('ox.django.fields.DictField', [], {'default': '{}'})
        }
    }

    complete_apps = ['changelog']