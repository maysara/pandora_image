# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Title'
        db.create_table('title_title', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('title', self.gf('django.db.models.fields.CharField')(unique=True, max_length=1000)),
            ('sorttitle', self.gf('django.db.models.fields.CharField')(max_length=1000)),
            ('sortsorttitle', self.gf('django.db.models.fields.CharField')(max_length=1000)),
            ('edited', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('imdbId', self.gf('django.db.models.fields.CharField')(max_length=7, blank=True)),
        ))
        db.send_create_signal('title', ['Title'])


    def backwards(self, orm):
        # Deleting model 'Title'
        db.delete_table('title_title')


    models = {
        'title.title': {
            'Meta': {'object_name': 'Title'},
            'edited': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imdbId': ('django.db.models.fields.CharField', [], {'max_length': '7', 'blank': 'True'}),
            'sortsorttitle': ('django.db.models.fields.CharField', [], {'max_length': '1000'}),
            'sorttitle': ('django.db.models.fields.CharField', [], {'max_length': '1000'}),
            'title': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '1000'})
        }
    }

    complete_apps = ['title']