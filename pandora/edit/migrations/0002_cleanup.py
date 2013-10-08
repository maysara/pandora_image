# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Position'
        db.create_table('edit_position', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('edit', self.gf('django.db.models.fields.related.ForeignKey')(related_name='position', to=orm['edit.Edit'])),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(related_name='edit_position', to=orm['auth.User'])),
            ('section', self.gf('django.db.models.fields.CharField')(max_length='255')),
            ('position', self.gf('django.db.models.fields.IntegerField')(default=0)),
        ))
        db.send_create_signal('edit', ['Position'])

        # Adding unique constraint on 'Position', fields ['user', 'edit', 'section']
        db.create_unique('edit_position', ['user_id', 'edit_id', 'section'])

        # Deleting field 'Clip.position'
        db.delete_column('edit_clip', 'position')

        # Deleting field 'Clip.edit_position'
        db.delete_column('edit_clip', 'edit_position')

        # Adding field 'Clip.index'
        db.add_column('edit_clip', 'index',
                      self.gf('django.db.models.fields.IntegerField')(default=0),
                      keep_default=False)

        # Adding field 'Clip.annotation'
        db.add_column('edit_clip', 'annotation',
                      self.gf('django.db.models.fields.related.ForeignKey')(default=None, related_name='editclip', null=True, to=orm['annotation.Annotation']),
                      keep_default=False)


        # Changing field 'Clip.item'
        db.alter_column('edit_clip', 'item_id', self.gf('django.db.models.fields.related.ForeignKey')(null=True, to=orm['item.Item']))
        # Deleting field 'Edit.public'
        db.delete_column('edit_edit', 'public')

        # Deleting field 'Edit.duration'
        db.delete_column('edit_edit', 'duration')

        # Adding field 'Edit.status'
        db.add_column('edit_edit', 'status',
                      self.gf('django.db.models.fields.CharField')(default='private', max_length=20),
                      keep_default=False)

        # Adding field 'Edit.description'
        db.add_column('edit_edit', 'description',
                      self.gf('django.db.models.fields.TextField')(default=''),
                      keep_default=False)

        # Adding field 'Edit.rightslevel'
        db.add_column('edit_edit', 'rightslevel',
                      self.gf('django.db.models.fields.IntegerField')(default=0, db_index=True),
                      keep_default=False)

        # Adding field 'Edit.icon'
        db.add_column('edit_edit', 'icon',
                      self.gf('django.db.models.fields.files.ImageField')(default=None, max_length=100, null=True, blank=True),
                      keep_default=False)

        # Adding field 'Edit.poster_frames'
        db.add_column('edit_edit', 'poster_frames',
                      self.gf('ox.django.fields.TupleField')(default=[]),
                      keep_default=False)

        # Adding M2M table for field subscribed_users on 'Edit'
        db.create_table('edit_edit_subscribed_users', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('edit', models.ForeignKey(orm['edit.edit'], null=False)),
            ('user', models.ForeignKey(orm['auth.user'], null=False))
        ))
        db.create_unique('edit_edit_subscribed_users', ['edit_id', 'user_id'])


    def backwards(self, orm):
        # Removing unique constraint on 'Position', fields ['user', 'edit', 'section']
        db.delete_unique('edit_position', ['user_id', 'edit_id', 'section'])

        # Deleting model 'Position'
        db.delete_table('edit_position')

        # Adding field 'Clip.position'
        db.add_column('edit_clip', 'position',
                      self.gf('django.db.models.fields.IntegerField')(default=0),
                      keep_default=False)

        # Adding field 'Clip.edit_position'
        db.add_column('edit_clip', 'edit_position',
                      self.gf('django.db.models.fields.FloatField')(default=0),
                      keep_default=False)

        # Deleting field 'Clip.index'
        db.delete_column('edit_clip', 'index')

        # Deleting field 'Clip.annotation'
        db.delete_column('edit_clip', 'annotation_id')


        # Changing field 'Clip.item'
        db.alter_column('edit_clip', 'item_id', self.gf('django.db.models.fields.related.ForeignKey')(default=None, to=orm['item.Item']))
        # Adding field 'Edit.public'
        db.add_column('edit_edit', 'public',
                      self.gf('django.db.models.fields.BooleanField')(default=False),
                      keep_default=False)

        # Adding field 'Edit.duration'
        db.add_column('edit_edit', 'duration',
                      self.gf('django.db.models.fields.FloatField')(default=0),
                      keep_default=False)

        # Deleting field 'Edit.status'
        db.delete_column('edit_edit', 'status')

        # Deleting field 'Edit.description'
        db.delete_column('edit_edit', 'description')

        # Deleting field 'Edit.rightslevel'
        db.delete_column('edit_edit', 'rightslevel')

        # Deleting field 'Edit.icon'
        db.delete_column('edit_edit', 'icon')

        # Deleting field 'Edit.poster_frames'
        db.delete_column('edit_edit', 'poster_frames')

        # Removing M2M table for field subscribed_users on 'Edit'
        db.delete_table('edit_edit_subscribed_users')


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
            'keywords': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'lightness': ('django.db.models.fields.FloatField', [], {'default': '0', 'db_index': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'notes': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
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
        'edit.clip': {
            'Meta': {'object_name': 'Clip'},
            'annotation': ('django.db.models.fields.related.ForeignKey', [], {'default': 'None', 'related_name': "'editclip'", 'null': 'True', 'to': "orm['annotation.Annotation']"}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'edit': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'clips'", 'to': "orm['edit.Edit']"}),
            'end': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'index': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'item': ('django.db.models.fields.related.ForeignKey', [], {'default': 'None', 'related_name': "'editclip'", 'null': 'True', 'to': "orm['item.Item']"}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'start': ('django.db.models.fields.FloatField', [], {'default': '0'})
        },
        'edit.edit': {
            'Meta': {'unique_together': "(('user', 'name'),)", 'object_name': 'Edit'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'default': "''"}),
            'icon': ('django.db.models.fields.files.ImageField', [], {'default': 'None', 'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'poster_frames': ('ox.django.fields.TupleField', [], {'default': '[]'}),
            'rightslevel': ('django.db.models.fields.IntegerField', [], {'default': '0', 'db_index': 'True'}),
            'status': ('django.db.models.fields.CharField', [], {'default': "'private'", 'max_length': '20'}),
            'subscribed_users': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'subscribed_edits'", 'symmetrical': 'False', 'to': "orm['auth.User']"}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        },
        'edit.position': {
            'Meta': {'unique_together': "(('user', 'edit', 'section'),)", 'object_name': 'Position'},
            'edit': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'position'", 'to': "orm['edit.Edit']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'position': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'section': ('django.db.models.fields.CharField', [], {'max_length': "'255'"}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'edit_position'", 'to': "orm['auth.User']"})
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
        }
    }

    complete_apps = ['edit']