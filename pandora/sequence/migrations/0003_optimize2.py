# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Deleting field 'Sequence.hash2'
        db.delete_column('sequence_sequence', 'hash')

        # Deleting field 'Sequence.mode2'
        db.delete_column('sequence_sequence', 'mode')

        db.rename_column('sequence_sequence', 'hash2', 'hash')
        db.rename_column('sequence_sequence', 'mode2', 'mode')


    def backwards(self, orm):
        db.rename_column('sequence_sequence', 'hash', 'hash2')
        db.rename_column('sequence_sequence', 'mode', 'mode2')

        # Adding field 'Sequence.hash'
        db.add_column('sequence_sequence', 'hash',
                      self.gf('django.db.models.fields.CharField')(max_length=16),
                      keep_default=False)

        # Adding field 'Sequence.mode'
        db.add_column('sequence_sequence', 'mode',
                      self.gf('django.db.models.fields.CharField')(max_length=128),
                      keep_default=False)


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
        },
        'item.itemsort': {
            'Meta': {'object_name': 'ItemSort'},
            'accessed': ('django.db.models.fields.DateTimeField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'aspectratio': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'bitrate': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'cinematographer': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'codirector': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'color': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'composer': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'country': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'cutsperminute': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'director': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'duration': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'editor': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'genre': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'height': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'hue': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'imdbId': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'item': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'sort'", 'unique': 'True', 'primary_key': 'True', 'to': "orm['item.Item']"}),
            'itemId': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'language': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'lightness': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'lyricist': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'numberofactors': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'numberofcuts': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'numberoffiles': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'parts': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'pixels': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'producer': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'productionCompany': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'random': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'resolution': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'rightslevel': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'runtime': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'saturation': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'size': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'sound': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'timesaccessed': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'volume': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'width': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'words': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'wordsperminute': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'writer': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'year': ('django.db.models.fields.CharField', [], {'max_length': '4', 'null': 'True', 'db_index': 'True'})
        },
        'sequence.sequence': {
            'Meta': {'unique_together': "(('sort', 'start', 'end', 'mode'),)", 'object_name': 'Sequence'},
            'duration': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'end': ('django.db.models.fields.FloatField', [], {'default': '-1'}),
            'hash': ('django.db.models.fields.BigIntegerField', [], {'default': '-9223372036854775808', 'db_index': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'mode': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'sort': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'sequences'", 'null': 'True', 'to': "orm['item.ItemSort']"}),
            'start': ('django.db.models.fields.FloatField', [], {'default': '-1', 'db_index': 'True'})
        }
    }

    complete_apps = ['sequence']
