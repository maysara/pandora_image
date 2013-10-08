# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Place'
        db.create_table('place_place', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('modified', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('defined', self.gf('django.db.models.fields.BooleanField')(default=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(related_name='places', null=True, to=orm['auth.User'])),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=1024)),
            ('alternativeNames', self.gf('ox.django.fields.TupleField')(default=[])),
            ('name_sort', self.gf('django.db.models.fields.CharField')(max_length=200, db_index=True)),
            ('name_find', self.gf('django.db.models.fields.TextField')(default='')),
            ('geoname', self.gf('django.db.models.fields.CharField')(max_length=1024, null=True)),
            ('geoname_sort', self.gf('django.db.models.fields.CharField')(max_length=1024, null=True, db_index=True)),
            ('countryCode', self.gf('django.db.models.fields.CharField')(default='', max_length=16, db_index=True)),
            ('wikipediaId', self.gf('django.db.models.fields.CharField')(max_length=1000, blank=True)),
            ('type', self.gf('django.db.models.fields.CharField')(default='', max_length=1000, db_index=True)),
            ('south', self.gf('django.db.models.fields.FloatField')(default=None, null=True, db_index=True)),
            ('west', self.gf('django.db.models.fields.FloatField')(default=None, null=True, db_index=True)),
            ('north', self.gf('django.db.models.fields.FloatField')(default=None, null=True, db_index=True)),
            ('east', self.gf('django.db.models.fields.FloatField')(default=None, null=True, db_index=True)),
            ('lat', self.gf('django.db.models.fields.FloatField')(default=None, null=True, db_index=True)),
            ('lng', self.gf('django.db.models.fields.FloatField')(default=None, null=True, db_index=True)),
            ('area', self.gf('django.db.models.fields.FloatField')(default=None, null=True, db_index=True)),
            ('matches', self.gf('django.db.models.fields.IntegerField')(default=0, db_index=True)),
        ))
        db.send_create_signal('place', ['Place'])

        # Adding M2M table for field items on 'Place'
        db.create_table('place_place_items', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('place', models.ForeignKey(orm['place.place'], null=False)),
            ('item', models.ForeignKey(orm['item.item'], null=False))
        ))
        db.create_unique('place_place_items', ['place_id', 'item_id'])

        # Adding M2M table for field annotations on 'Place'
        db.create_table('place_place_annotations', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('place', models.ForeignKey(orm['place.place'], null=False)),
            ('annotation', models.ForeignKey(orm['annotation.annotation'], null=False))
        ))
        db.create_unique('place_place_annotations', ['place_id', 'annotation_id'])


    def backwards(self, orm):
        # Deleting model 'Place'
        db.delete_table('place_place')

        # Removing M2M table for field items on 'Place'
        db.delete_table('place_place_items')

        # Removing M2M table for field annotations on 'Place'
        db.delete_table('place_place_annotations')


    models = {
        'annotation.annotation': {
            'Meta': {'object_name': 'Annotation'},
            'clip': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'annotations'", 'null': 'True', 'to': "orm['clip.Clip']"}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'end': ('django.db.models.fields.FloatField', [], {'default': '-1', 'db_index': 'True'}),
            'findvalue': ('django.db.models.fields.TextField', [], {'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'item': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'annotations'", 'to': "orm['item.Item']"}),
            'layer': ('django.db.models.fields.CharField', [], {'max_length': '255', 'db_index': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'public_id': ('django.db.models.fields.CharField', [], {'max_length': '128', 'unique': 'True', 'null': 'True'}),
            'sortvalue': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '1000', 'null': 'True', 'blank': 'True'}),
            'start': ('django.db.models.fields.FloatField', [], {'default': '-1', 'db_index': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
            'value': ('django.db.models.fields.TextField', [], {})
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
        'clip.clip': {
            'Meta': {'unique_together': "(('item', 'start', 'end'),)", 'object_name': 'Clip'},
            'aspect_ratio': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'duration': ('django.db.models.fields.FloatField', [], {'default': '0', 'db_index': 'True'}),
            'end': ('django.db.models.fields.FloatField', [], {'default': '-1'}),
            'findvalue': ('django.db.models.fields.TextField', [], {'null': 'True', 'db_index': 'True'}),
            'hue': ('django.db.models.fields.FloatField', [], {'default': '0', 'db_index': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'item': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'clips'", 'to': "orm['item.Item']"}),
            'lightness': ('django.db.models.fields.FloatField', [], {'default': '0', 'db_index': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'saturation': ('django.db.models.fields.FloatField', [], {'default': '0', 'db_index': 'True'}),
            'sort': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'matching_clips'", 'to': "orm['item.ItemSort']"}),
            'sortvalue': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'start': ('django.db.models.fields.FloatField', [], {'default': '-1', 'db_index': 'True'}),
            'subtitles': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'user': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'db_index': 'True'}),
            'volume': ('django.db.models.fields.FloatField', [], {'default': '0', 'null': 'True', 'db_index': 'True'})
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
            'budget': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'cinematographer': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'country': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'cutsperminute': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'director': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'duration': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'editor': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'genre': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'gross': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'height': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'hue': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'item': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'sort'", 'unique': 'True', 'primary_key': 'True', 'to': "orm['item.Item']"}),
            'itemId': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'language': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'lightness': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'likes': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'numberofactors': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'numberofcuts': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'numberoffiles': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'parts': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'pixels': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'producer': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'profit': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'random': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'releasedate': ('django.db.models.fields.DateTimeField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'resolution': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'rightslevel': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'runtime': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'saturation': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'size': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'timesaccessed': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'volume': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'votes': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'width': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'words': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'wordsperminute': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'writer': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'year': ('django.db.models.fields.CharField', [], {'max_length': '4', 'null': 'True', 'db_index': 'True'})
        },
        'place.place': {
            'Meta': {'ordering': "('name_sort',)", 'object_name': 'Place'},
            'alternativeNames': ('ox.django.fields.TupleField', [], {'default': '[]'}),
            'annotations': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'places'", 'blank': 'True', 'to': "orm['annotation.Annotation']"}),
            'area': ('django.db.models.fields.FloatField', [], {'default': 'None', 'null': 'True', 'db_index': 'True'}),
            'countryCode': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '16', 'db_index': 'True'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'defined': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'east': ('django.db.models.fields.FloatField', [], {'default': 'None', 'null': 'True', 'db_index': 'True'}),
            'geoname': ('django.db.models.fields.CharField', [], {'max_length': '1024', 'null': 'True'}),
            'geoname_sort': ('django.db.models.fields.CharField', [], {'max_length': '1024', 'null': 'True', 'db_index': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'items': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'places'", 'blank': 'True', 'to': "orm['item.Item']"}),
            'lat': ('django.db.models.fields.FloatField', [], {'default': 'None', 'null': 'True', 'db_index': 'True'}),
            'lng': ('django.db.models.fields.FloatField', [], {'default': 'None', 'null': 'True', 'db_index': 'True'}),
            'matches': ('django.db.models.fields.IntegerField', [], {'default': '0', 'db_index': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '1024'}),
            'name_find': ('django.db.models.fields.TextField', [], {'default': "''"}),
            'name_sort': ('django.db.models.fields.CharField', [], {'max_length': '200', 'db_index': 'True'}),
            'north': ('django.db.models.fields.FloatField', [], {'default': 'None', 'null': 'True', 'db_index': 'True'}),
            'south': ('django.db.models.fields.FloatField', [], {'default': 'None', 'null': 'True', 'db_index': 'True'}),
            'type': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '1000', 'db_index': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'places'", 'null': 'True', 'to': "orm['auth.User']"}),
            'west': ('django.db.models.fields.FloatField', [], {'default': 'None', 'null': 'True', 'db_index': 'True'}),
            'wikipediaId': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'blank': 'True'})
        }
    }

    complete_apps = ['place']