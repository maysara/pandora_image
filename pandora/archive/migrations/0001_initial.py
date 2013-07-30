# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'File'
        db.create_table('archive_file', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('modified', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('oshash', self.gf('django.db.models.fields.CharField')(unique=True, max_length=16)),
            ('item', self.gf('django.db.models.fields.related.ForeignKey')(related_name='files', to=orm['item.Item'])),
            ('path', self.gf('django.db.models.fields.CharField')(default='', max_length=2048)),
            ('sort_path', self.gf('django.db.models.fields.CharField')(default='', max_length=2048)),
            ('type', self.gf('django.db.models.fields.CharField')(default='', max_length=255)),
            ('extension', self.gf('django.db.models.fields.CharField')(default='', max_length=255, null=True)),
            ('language', self.gf('django.db.models.fields.CharField')(default='', max_length=8, null=True)),
            ('part', self.gf('django.db.models.fields.CharField')(default='', max_length=255, null=True)),
            ('part_title', self.gf('django.db.models.fields.CharField')(default='', max_length=255, null=True)),
            ('version', self.gf('django.db.models.fields.CharField')(default='', max_length=255, null=True)),
            ('size', self.gf('django.db.models.fields.BigIntegerField')(default=0)),
            ('duration', self.gf('django.db.models.fields.FloatField')(null=True)),
            ('info', self.gf('ox.django.fields.DictField')(default={})),
            ('path_info', self.gf('ox.django.fields.DictField')(default={})),
            ('video_codec', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('pixel_format', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('display_aspect_ratio', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('width', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('height', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('framerate', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('audio_codec', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('channels', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('samplerate', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('bits_per_pixel', self.gf('django.db.models.fields.FloatField')(default=-1)),
            ('pixels', self.gf('django.db.models.fields.BigIntegerField')(default=0)),
            ('available', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('selected', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('uploading', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('wanted', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('is_audio', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('is_video', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('is_subtitle', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('data', self.gf('django.db.models.fields.files.FileField')(max_length=100, null=True, blank=True)),
        ))
        db.send_create_signal('archive', ['File'])

        # Adding model 'Volume'
        db.create_table('archive_volume', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('modified', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(related_name='volumes', to=orm['auth.User'])),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=1024)),
        ))
        db.send_create_signal('archive', ['Volume'])

        # Adding unique constraint on 'Volume', fields ['user', 'name']
        db.create_unique('archive_volume', ['user_id', 'name'])

        # Adding model 'Instance'
        db.create_table('archive_instance', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('modified', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('atime', self.gf('django.db.models.fields.IntegerField')(default=1351855089)),
            ('ctime', self.gf('django.db.models.fields.IntegerField')(default=1351855089)),
            ('mtime', self.gf('django.db.models.fields.IntegerField')(default=1351855089)),
            ('path', self.gf('django.db.models.fields.CharField')(max_length=2048)),
            ('ignore', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('file', self.gf('django.db.models.fields.related.ForeignKey')(related_name='instances', to=orm['archive.File'])),
            ('volume', self.gf('django.db.models.fields.related.ForeignKey')(related_name='files', to=orm['archive.Volume'])),
        ))
        db.send_create_signal('archive', ['Instance'])

        # Adding unique constraint on 'Instance', fields ['path', 'volume']
        db.create_unique('archive_instance', ['path', 'volume_id'])

        # Adding model 'Frame'
        db.create_table('archive_frame', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('modified', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('file', self.gf('django.db.models.fields.related.ForeignKey')(related_name='frames', to=orm['archive.File'])),
            ('position', self.gf('django.db.models.fields.FloatField')()),
            ('frame', self.gf('django.db.models.fields.files.ImageField')(default=None, max_length=100, null=True)),
        ))
        db.send_create_signal('archive', ['Frame'])

        # Adding unique constraint on 'Frame', fields ['file', 'position']
        db.create_unique('archive_frame', ['file_id', 'position'])

        # Adding model 'Stream'
        db.create_table('archive_stream', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('file', self.gf('django.db.models.fields.related.ForeignKey')(related_name='streams', to=orm['archive.File'])),
            ('resolution', self.gf('django.db.models.fields.IntegerField')(default=96)),
            ('format', self.gf('django.db.models.fields.CharField')(default='webm', max_length=255)),
            ('video', self.gf('django.db.models.fields.files.FileField')(default=None, max_length=100, blank=True)),
            ('source', self.gf('django.db.models.fields.related.ForeignKey')(default=None, related_name='derivatives', null=True, to=orm['archive.Stream'])),
            ('available', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('oshash', self.gf('django.db.models.fields.CharField')(max_length=16, null=True, db_index=True)),
            ('info', self.gf('ox.django.fields.DictField')(default={})),
            ('duration', self.gf('django.db.models.fields.FloatField')(default=0)),
            ('aspect_ratio', self.gf('django.db.models.fields.FloatField')(default=0)),
            ('cuts', self.gf('ox.django.fields.TupleField')(default=[])),
            ('color', self.gf('ox.django.fields.TupleField')(default=[])),
            ('volume', self.gf('django.db.models.fields.FloatField')(default=0)),
        ))
        db.send_create_signal('archive', ['Stream'])

        # Adding unique constraint on 'Stream', fields ['file', 'resolution', 'format']
        db.create_unique('archive_stream', ['file_id', 'resolution', 'format'])


    def backwards(self, orm):
        # Removing unique constraint on 'Stream', fields ['file', 'resolution', 'format']
        db.delete_unique('archive_stream', ['file_id', 'resolution', 'format'])

        # Removing unique constraint on 'Frame', fields ['file', 'position']
        db.delete_unique('archive_frame', ['file_id', 'position'])

        # Removing unique constraint on 'Instance', fields ['path', 'volume']
        db.delete_unique('archive_instance', ['path', 'volume_id'])

        # Removing unique constraint on 'Volume', fields ['user', 'name']
        db.delete_unique('archive_volume', ['user_id', 'name'])

        # Deleting model 'File'
        db.delete_table('archive_file')

        # Deleting model 'Volume'
        db.delete_table('archive_volume')

        # Deleting model 'Instance'
        db.delete_table('archive_instance')

        # Deleting model 'Frame'
        db.delete_table('archive_frame')

        # Deleting model 'Stream'
        db.delete_table('archive_stream')


    models = {
        'archive.file': {
            'Meta': {'object_name': 'File'},
            'audio_codec': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'available': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'bits_per_pixel': ('django.db.models.fields.FloatField', [], {'default': '-1'}),
            'channels': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'data': ('django.db.models.fields.files.FileField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'display_aspect_ratio': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'duration': ('django.db.models.fields.FloatField', [], {'null': 'True'}),
            'extension': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '255', 'null': 'True'}),
            'framerate': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'height': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'info': ('ox.django.fields.DictField', [], {'default': '{}'}),
            'is_audio': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_subtitle': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_video': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'item': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'files'", 'to': "orm['item.Item']"}),
            'language': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '8', 'null': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'oshash': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '16'}),
            'part': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '255', 'null': 'True'}),
            'part_title': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '255', 'null': 'True'}),
            'path': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '2048'}),
            'path_info': ('ox.django.fields.DictField', [], {'default': '{}'}),
            'pixel_format': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'pixels': ('django.db.models.fields.BigIntegerField', [], {'default': '0'}),
            'samplerate': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'selected': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'size': ('django.db.models.fields.BigIntegerField', [], {'default': '0'}),
            'sort_path': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '2048'}),
            'type': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '255'}),
            'uploading': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'version': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '255', 'null': 'True'}),
            'video_codec': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'wanted': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'width': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        'archive.frame': {
            'Meta': {'unique_together': "(('file', 'position'),)", 'object_name': 'Frame'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'file': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'frames'", 'to': "orm['archive.File']"}),
            'frame': ('django.db.models.fields.files.ImageField', [], {'default': 'None', 'max_length': '100', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'position': ('django.db.models.fields.FloatField', [], {})
        },
        'archive.instance': {
            'Meta': {'unique_together': "(('path', 'volume'),)", 'object_name': 'Instance'},
            'atime': ('django.db.models.fields.IntegerField', [], {'default': '1351855089'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'ctime': ('django.db.models.fields.IntegerField', [], {'default': '1351855089'}),
            'file': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'instances'", 'to': "orm['archive.File']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'ignore': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'mtime': ('django.db.models.fields.IntegerField', [], {'default': '1351855089'}),
            'path': ('django.db.models.fields.CharField', [], {'max_length': '2048'}),
            'volume': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'files'", 'to': "orm['archive.Volume']"})
        },
        'archive.stream': {
            'Meta': {'unique_together': "(('file', 'resolution', 'format'),)", 'object_name': 'Stream'},
            'aspect_ratio': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'available': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'color': ('ox.django.fields.TupleField', [], {'default': '[]'}),
            'cuts': ('ox.django.fields.TupleField', [], {'default': '[]'}),
            'duration': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'file': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'streams'", 'to': "orm['archive.File']"}),
            'format': ('django.db.models.fields.CharField', [], {'default': "'webm'", 'max_length': '255'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'info': ('ox.django.fields.DictField', [], {'default': '{}'}),
            'oshash': ('django.db.models.fields.CharField', [], {'max_length': '16', 'null': 'True', 'db_index': 'True'}),
            'resolution': ('django.db.models.fields.IntegerField', [], {'default': '96'}),
            'source': ('django.db.models.fields.related.ForeignKey', [], {'default': 'None', 'related_name': "'derivatives'", 'null': 'True', 'to': "orm['archive.Stream']"}),
            'video': ('django.db.models.fields.files.FileField', [], {'default': 'None', 'max_length': '100', 'blank': 'True'}),
            'volume': ('django.db.models.fields.FloatField', [], {'default': '0'})
        },
        'archive.volume': {
            'Meta': {'unique_together': "(('user', 'name'),)", 'object_name': 'Volume'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '1024'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'volumes'", 'to': "orm['auth.User']"})
        },
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

    complete_apps = ['archive']