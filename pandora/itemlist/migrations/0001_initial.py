# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'List'
        db.create_table('itemlist_list', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('modified', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(related_name='lists', to=orm['auth.User'])),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('status', self.gf('django.db.models.fields.CharField')(default='private', max_length=20)),
            ('query', self.gf('ox.django.fields.DictField')(default={'static': True})),
            ('type', self.gf('django.db.models.fields.CharField')(default='static', max_length=255)),
            ('description', self.gf('django.db.models.fields.TextField')(default='')),
            ('icon', self.gf('django.db.models.fields.files.ImageField')(default=None, max_length=100, blank=True)),
            ('view', self.gf('django.db.models.fields.TextField')(default=('g', 'r', 'i', 'd'))),
            ('sort', self.gf('ox.django.fields.TupleField')(default=({'operator': '+', 'key': 'director'},))),
            ('poster_frames', self.gf('ox.django.fields.TupleField')(default=[])),
            ('numberofitems', self.gf('django.db.models.fields.IntegerField')(default=0)),
        ))
        db.send_create_signal('itemlist', ['List'])

        # Adding unique constraint on 'List', fields ['user', 'name']
        db.create_unique('itemlist_list', ['user_id', 'name'])

        # Adding M2M table for field subscribed_users on 'List'
        db.create_table('itemlist_list_subscribed_users', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('list', models.ForeignKey(orm['itemlist.list'], null=False)),
            ('user', models.ForeignKey(orm['auth.user'], null=False))
        ))
        db.create_unique('itemlist_list_subscribed_users', ['list_id', 'user_id'])

        # Adding model 'ListItem'
        db.create_table('itemlist_listitem', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('modified', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('list', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['itemlist.List'])),
            ('item', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['item.Item'])),
        ))
        db.send_create_signal('itemlist', ['ListItem'])

        # Adding model 'Position'
        db.create_table('itemlist_position', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('list', self.gf('django.db.models.fields.related.ForeignKey')(related_name='position', to=orm['itemlist.List'])),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('section', self.gf('django.db.models.fields.CharField')(max_length='255')),
            ('position', self.gf('django.db.models.fields.IntegerField')(default=0)),
        ))
        db.send_create_signal('itemlist', ['Position'])

        # Adding unique constraint on 'Position', fields ['user', 'list', 'section']
        db.create_unique('itemlist_position', ['user_id', 'list_id', 'section'])


    def backwards(self, orm):
        # Removing unique constraint on 'Position', fields ['user', 'list', 'section']
        db.delete_unique('itemlist_position', ['user_id', 'list_id', 'section'])

        # Removing unique constraint on 'List', fields ['user', 'name']
        db.delete_unique('itemlist_list', ['user_id', 'name'])

        # Deleting model 'List'
        db.delete_table('itemlist_list')

        # Removing M2M table for field subscribed_users on 'List'
        db.delete_table('itemlist_list_subscribed_users')

        # Deleting model 'ListItem'
        db.delete_table('itemlist_listitem')

        # Deleting model 'Position'
        db.delete_table('itemlist_position')


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
        'itemlist.list': {
            'Meta': {'unique_together': "(('user', 'name'),)", 'object_name': 'List'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'default': "''"}),
            'icon': ('django.db.models.fields.files.ImageField', [], {'default': 'None', 'max_length': '100', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'items': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'lists'", 'symmetrical': 'False', 'through': "orm['itemlist.ListItem']", 'to': "orm['item.Item']"}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'numberofitems': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'poster_frames': ('ox.django.fields.TupleField', [], {'default': '[]'}),
            'query': ('ox.django.fields.DictField', [], {'default': "{'static': True}"}),
            'sort': ('ox.django.fields.TupleField', [], {'default': "({'operator': '+', 'key': 'director'},)"}),
            'status': ('django.db.models.fields.CharField', [], {'default': "'private'", 'max_length': '20'}),
            'subscribed_users': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'subscribed_lists'", 'symmetrical': 'False', 'to': "orm['auth.User']"}),
            'type': ('django.db.models.fields.CharField', [], {'default': "'static'", 'max_length': '255'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'lists'", 'to': "orm['auth.User']"}),
            'view': ('django.db.models.fields.TextField', [], {'default': "('g', 'r', 'i', 'd')"})
        },
        'itemlist.listitem': {
            'Meta': {'object_name': 'ListItem'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'item': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['item.Item']"}),
            'list': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['itemlist.List']"}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        },
        'itemlist.position': {
            'Meta': {'unique_together': "(('user', 'list', 'section'),)", 'object_name': 'Position'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'list': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'position'", 'to': "orm['itemlist.List']"}),
            'position': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'section': ('django.db.models.fields.CharField', [], {'max_length': "'255'"}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        }
    }

    complete_apps = ['itemlist']