# -*- coding: utf-8 -*-
import os
from os.path import exists, join
import datetime

from south.db import db
from south.v2 import SchemaMigration
from django.db import models
from django.conf import settings

class Migration(SchemaMigration):

    def forwards(self, orm):
        files_path = join(settings.MEDIA_ROOT, 'files')
        documents_path = join(settings.MEDIA_ROOT, 'documents')
        if not exists(documents_path) and exists(files_path):
            os.rename(files_path, documents_path)
        db.rename_table('file_file', 'document_document')
        for f in orm['document.Document'].objects.all():
            f.file.name = f.file.name.replace('files/', 'documents/')
            f.save()

    def backwards(self, orm):
        files_path = join(settings.MEDIA_ROOT, 'files')
        documents_path = join(settings.MEDIA_ROOT, 'documents')
        if not exists(files_path) and exists(documents_path):
            os.rename(documents_path, files_path)
        for f in orm['document.Document'].objects.all():
            f.file.name = f.file.name.replace('documents/', 'files/')
            f.save()
        db.rename_table('document_document', 'file_file')

    models = {
        'auth.group': {
            'Meta': {'object_name': 'Group'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        'auth.permission': {
            'Meta': {'ordering': "('content_type__app_label', 'content_type__model', 'codename')", 'unique_together': "(('content_type', 'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '255', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'})
        },
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        'document.document': {
            'Meta': {'unique_together': "(('user', 'name', 'extension'),)", 'object_name': 'Document'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'default': "''"}),
            'description_sort': ('django.db.models.fields.CharField', [], {'max_length': '512'}),
            'extension': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'file': ('django.db.models.fields.files.FileField', [], {'default': 'None', 'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'matches': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'name_sort': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'oshash': ('django.db.models.fields.CharField', [], {'max_length': '16', 'unique': 'True', 'null': 'True'}),
            'ratio': ('django.db.models.fields.FloatField', [], {'default': '1'}),
            'size': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'uploading': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'files'", 'to': "orm['auth.User']"})
        }
    }

    complete_apps = ['document']
