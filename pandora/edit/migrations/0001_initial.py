# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Edit'
        db.create_table('edit_edit', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('modified', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('public', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('duration', self.gf('django.db.models.fields.FloatField')(default=0)),
        ))
        db.send_create_signal('edit', ['Edit'])

        # Adding unique constraint on 'Edit', fields ['user', 'name']
        db.create_unique('edit_edit', ['user_id', 'name'])

        # Adding model 'Clip'
        db.create_table('edit_clip', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('modified', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('edit', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['edit.Edit'])),
            ('position', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('edit_position', self.gf('django.db.models.fields.FloatField')(default=0)),
            ('item', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['item.Item'])),
            ('start', self.gf('django.db.models.fields.FloatField')(default=0)),
            ('end', self.gf('django.db.models.fields.FloatField')(default=0)),
        ))
        db.send_create_signal('edit', ['Clip'])


    def backwards(self, orm):
        # Removing unique constraint on 'Edit', fields ['user', 'name']
        db.delete_unique('edit_edit', ['user_id', 'name'])

        # Deleting model 'Edit'
        db.delete_table('edit_edit')

        # Deleting model 'Clip'
        db.delete_table('edit_clip')


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
        'edit.clip': {
            'Meta': {'object_name': 'Clip'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'edit': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['edit.Edit']"}),
            'edit_position': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'end': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'item': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['item.Item']"}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'position': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'start': ('django.db.models.fields.FloatField', [], {'default': '0'})
        },
        'edit.edit': {
            'Meta': {'unique_together': "(('user', 'name'),)", 'object_name': 'Edit'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'duration': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'public': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        },
        'item.item': {
            'Meta': {'object_name': 'Item'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'data': ('ox.django.fields.DictField', [], {'default': '{}'}),
            'external_data': ('ox.django.fields.DictField', [], {'default': '{}'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'items'", 'blank': 'True', 'to': "orm['auth.Group']"}),
            'icon': ('django.db.models.fields.files.ImageField', [], {'default': 'None', 'max_length': '100', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'itemId': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '128', 'blank': 'True'}),
            'json': ('ox.django.fields.DictField', [], {'default': '{}'}),
            'level': ('django.db.models.fields.IntegerField', [], {'db_index': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'notes': ('django.db.models.fields.TextField', [], {'default': "''"}),
            'oxdbId': ('django.db.models.fields.CharField', [], {'max_length': '42', 'unique': 'True', 'null': 'True', 'blank': 'True'}),
            'poster': ('django.db.models.fields.files.ImageField', [], {'default': 'None', 'max_length': '100', 'blank': 'True'}),
            'poster_frame': ('django.db.models.fields.FloatField', [], {'default': '-1'}),
            'poster_height': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'poster_source': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'poster_width': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'rendered': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'stream_aspect': ('django.db.models.fields.FloatField', [], {'default': '1.3333333333333333'}),
            'stream_info': ('ox.django.fields.DictField', [], {'default': '{}'}),
            'torrent': ('django.db.models.fields.files.FileField', [], {'default': 'None', 'max_length': '1000', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'items'", 'null': 'True', 'to': "orm['auth.User']"})
        }
    }

    complete_apps = ['edit']