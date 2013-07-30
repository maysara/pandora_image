# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Item'
        db.create_table('item_item', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('modified', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(related_name='items', null=True, to=orm['auth.User'])),
            ('rendered', self.gf('django.db.models.fields.BooleanField')(default=False, db_index=True)),
            ('level', self.gf('django.db.models.fields.IntegerField')(db_index=True)),
            ('itemId', self.gf('django.db.models.fields.CharField')(unique=True, max_length=128, blank=True)),
            ('oxdbId', self.gf('django.db.models.fields.CharField')(max_length=42, unique=True, null=True, blank=True)),
            ('external_data', self.gf('ox.django.fields.DictField')(default={})),
            ('data', self.gf('ox.django.fields.DictField')(default={})),
            ('json', self.gf('ox.django.fields.DictField')(default={})),
            ('poster', self.gf('django.db.models.fields.files.ImageField')(default=None, max_length=100, blank=True)),
            ('poster_source', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('poster_height', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('poster_width', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('poster_frame', self.gf('django.db.models.fields.FloatField')(default=-1)),
            ('icon', self.gf('django.db.models.fields.files.ImageField')(default=None, max_length=100, blank=True)),
            ('torrent', self.gf('django.db.models.fields.files.FileField')(default=None, max_length=1000, blank=True)),
            ('stream_info', self.gf('ox.django.fields.DictField')(default={})),
            ('notes', self.gf('django.db.models.fields.TextField')(default='')),
            ('stream_aspect', self.gf('django.db.models.fields.FloatField')(default=1.3333333333333333)),
        ))
        db.send_create_signal('item', ['Item'])

        # Adding M2M table for field groups on 'Item'
        db.create_table('item_item_groups', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('item', models.ForeignKey(orm['item.item'], null=False)),
            ('group', models.ForeignKey(orm['auth.group'], null=False))
        ))
        db.create_unique('item_item_groups', ['item_id', 'group_id'])

        # Adding model 'ItemSort'
        db.create_table('item_itemsort', (
            ('item', self.gf('django.db.models.fields.related.ForeignKey')(related_name='sort', to=orm['item.Item'],primary_key=True)),
        ))
        # Adding model 'ItemFind'
        db.create_table('item_itemfind', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('item', self.gf('django.db.models.fields.related.ForeignKey')(related_name='find', to=orm['item.Item'])),
            ('key', self.gf('django.db.models.fields.CharField')(max_length=200, db_index=True)),
            ('value', self.gf('django.db.models.fields.TextField')(db_index=False, blank=False)),
        ))
        db.send_create_signal('item', ['ItemFind'])

        # Adding unique constraint on 'ItemFind', fields ['item', 'key']
        db.create_unique('item_itemfind', ['item_id', 'key'])

        # Adding model 'Access'
        db.create_table('item_access', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('access', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('item', self.gf('django.db.models.fields.related.ForeignKey')(related_name='accessed', to=orm['item.Item'])),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(related_name='accessed_items', null=True, to=orm['auth.User'])),
            ('accessed', self.gf('django.db.models.fields.IntegerField')(default=0)),
        ))
        db.send_create_signal('item', ['Access'])

        # Adding unique constraint on 'Access', fields ['item', 'user']
        db.create_unique('item_access', ['item_id', 'user_id'])

        # Adding model 'Facet'
        db.create_table('item_facet', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('item', self.gf('django.db.models.fields.related.ForeignKey')(related_name='facets', to=orm['item.Item'])),
            ('key', self.gf('django.db.models.fields.CharField')(max_length=200, db_index=True)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=1000, db_index=True)),
            ('sortvalue', self.gf('django.db.models.fields.CharField')(max_length=1000, db_index=True)),
        ))
        db.send_create_signal('item', ['Facet'])

        # Adding unique constraint on 'Facet', fields ['item', 'key', 'value']
        db.create_unique('item_facet', ['item_id', 'key', 'value'])

        # Adding model 'Description'
        db.create_table('item_description', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('key', self.gf('django.db.models.fields.CharField')(max_length=200, db_index=True)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=1000, db_index=True)),
            ('description', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal('item', ['Description'])

        # Adding unique constraint on 'Description', fields ['key', 'value']
        db.create_unique('item_description', ['key', 'value'])


    def backwards(self, orm):
        # Removing unique constraint on 'Description', fields ['key', 'value']
        db.delete_unique('item_description', ['key', 'value'])

        # Removing unique constraint on 'Facet', fields ['item', 'key', 'value']
        db.delete_unique('item_facet', ['item_id', 'key', 'value'])

        # Removing unique constraint on 'Access', fields ['item', 'user']
        db.delete_unique('item_access', ['item_id', 'user_id'])

        # Removing unique constraint on 'ItemFind', fields ['item', 'key']
        db.delete_unique('item_itemfind', ['item_id', 'key'])

        # Deleting model 'Item'
        db.delete_table('item_item')

        # Removing M2M table for field groups on 'Item'
        db.delete_table('item_item_groups')

        # Deleting model 'ItemFind'
        db.delete_table('item_itemfind')

        # Deleting model 'Access'
        db.delete_table('item_access')

        # Deleting model 'Facet'
        db.delete_table('item_facet')

        # Deleting model 'Description'
        db.delete_table('item_description')


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
        'item.access': {
            'Meta': {'unique_together': "(('item', 'user'),)", 'object_name': 'Access'},
            'access': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'accessed': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'item': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'accessed'", 'to': "orm['item.Item']"}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'accessed_items'", 'null': 'True', 'to': "orm['auth.User']"})
        },
        'item.description': {
            'Meta': {'unique_together': "(('key', 'value'),)", 'object_name': 'Description'},
            'description': ('django.db.models.fields.TextField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'key': ('django.db.models.fields.CharField', [], {'max_length': '200', 'db_index': 'True'}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'db_index': 'True'})
        },
        'item.facet': {
            'Meta': {'unique_together': "(('item', 'key', 'value'),)", 'object_name': 'Facet'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'item': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'facets'", 'to': "orm['item.Item']"}),
            'key': ('django.db.models.fields.CharField', [], {'max_length': '200', 'db_index': 'True'}),
            'sortvalue': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'db_index': 'True'}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'db_index': 'True'})
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
        'item.itemfind': {
            'Meta': {'unique_together': "(('item', 'key'),)", 'object_name': 'ItemFind'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'item': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'find'", 'to': "orm['item.Item']"}),
            'key': ('django.db.models.fields.CharField', [], {'max_length': '200', 'db_index': 'True'}),
            'value': ('django.db.models.fields.TextField', [], {'db_index': 'False', 'blank': 'True'})
        }
    }

    complete_apps = ['item']
