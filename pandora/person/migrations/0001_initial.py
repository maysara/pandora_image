# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Person'
        db.create_table('person_person', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=200)),
            ('sortname', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('sortsortname', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('edited', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('numberofnames', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('aliases', self.gf('ox.django.fields.TupleField')(default=[])),
            ('imdbId', self.gf('django.db.models.fields.CharField')(max_length=7, blank=True)),
            ('wikipediaId', self.gf('django.db.models.fields.CharField')(max_length=1000, blank=True)),
        ))
        db.send_create_signal('person', ['Person'])


    def backwards(self, orm):
        # Deleting model 'Person'
        db.delete_table('person_person')


    models = {
        'person.person': {
            'Meta': {'object_name': 'Person'},
            'aliases': ('ox.django.fields.TupleField', [], {'default': '[]'}),
            'edited': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imdbId': ('django.db.models.fields.CharField', [], {'max_length': '7', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '200'}),
            'numberofnames': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'sortname': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'sortsortname': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'wikipediaId': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'blank': 'True'})
        }
    }

    complete_apps = ['person']