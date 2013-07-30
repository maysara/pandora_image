# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'IDAlias'
        db.create_table('urlalias_idalias', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('old', self.gf('django.db.models.fields.CharField')(unique=True, max_length=255)),
            ('new', self.gf('django.db.models.fields.CharField')(max_length=255)),
        ))
        db.send_create_signal('urlalias', ['IDAlias'])

        # Adding model 'LayerAlias'
        db.create_table('urlalias_layeralias', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('old', self.gf('django.db.models.fields.CharField')(unique=True, max_length=255)),
            ('new', self.gf('django.db.models.fields.CharField')(max_length=255)),
        ))
        db.send_create_signal('urlalias', ['LayerAlias'])

        # Adding model 'ListAlias'
        db.create_table('urlalias_listalias', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('old', self.gf('django.db.models.fields.CharField')(unique=True, max_length=255)),
            ('new', self.gf('django.db.models.fields.CharField')(max_length=255)),
        ))
        db.send_create_signal('urlalias', ['ListAlias'])

        # Adding model 'Alias'
        db.create_table('urlalias_alias', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('url', self.gf('django.db.models.fields.CharField')(unique=True, max_length=255)),
            ('target', self.gf('django.db.models.fields.CharField')(max_length=255)),
        ))
        db.send_create_signal('urlalias', ['Alias'])


    def backwards(self, orm):
        # Deleting model 'IDAlias'
        db.delete_table('urlalias_idalias')

        # Deleting model 'LayerAlias'
        db.delete_table('urlalias_layeralias')

        # Deleting model 'ListAlias'
        db.delete_table('urlalias_listalias')

        # Deleting model 'Alias'
        db.delete_table('urlalias_alias')


    models = {
        'urlalias.alias': {
            'Meta': {'object_name': 'Alias'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'target': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'url': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'})
        },
        'urlalias.idalias': {
            'Meta': {'object_name': 'IDAlias'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'new': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'old': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'})
        },
        'urlalias.layeralias': {
            'Meta': {'object_name': 'LayerAlias'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'new': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'old': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'})
        },
        'urlalias.listalias': {
            'Meta': {'object_name': 'ListAlias'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'new': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'old': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'})
        }
    }

    complete_apps = ['urlalias']