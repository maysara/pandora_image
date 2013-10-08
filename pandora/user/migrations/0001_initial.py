# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'SessionData'
        db.create_table('user_sessiondata', (
            ('session_key', self.gf('django.db.models.fields.CharField')(max_length=40, primary_key=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='data', unique=True, null=True, to=orm['auth.User'])),
            ('firstseen', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, db_index=True, blank=True)),
            ('lastseen', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime.now, db_index=True)),
            ('username', self.gf('django.db.models.fields.CharField')(max_length=255, null=True, db_index=True)),
            ('level', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('timesseen', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('ip', self.gf('django.db.models.fields.CharField')(max_length=255, null=True)),
            ('useragent', self.gf('django.db.models.fields.CharField')(max_length=255, null=True)),
            ('windowsize', self.gf('django.db.models.fields.CharField')(max_length=255, null=True)),
            ('screensize', self.gf('django.db.models.fields.CharField')(max_length=255, null=True)),
            ('info', self.gf('ox.django.fields.DictField')(default={})),
            ('location', self.gf('django.db.models.fields.CharField')(max_length=255, null=True)),
            ('location_sort', self.gf('django.db.models.fields.CharField')(max_length=255, null=True)),
            ('system', self.gf('django.db.models.fields.CharField')(max_length=255, null=True)),
            ('browser', self.gf('django.db.models.fields.CharField')(max_length=255, null=True)),
            ('numberoflists', self.gf('django.db.models.fields.IntegerField')(default=0, null=True)),
            ('groupssort', self.gf('django.db.models.fields.CharField')(default=None, max_length=255, null=True, blank=True)),
        ))
        db.send_create_signal('user', ['SessionData'])

        # Adding model 'UserProfile'
        db.create_table('user_userprofile', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('reset_code', self.gf('django.db.models.fields.CharField')(max_length=255, unique=True, null=True, blank=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(related_name='profile', unique=True, to=orm['auth.User'])),
            ('level', self.gf('django.db.models.fields.IntegerField')(default=1)),
            ('files_updated', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime.now)),
            ('newsletter', self.gf('django.db.models.fields.BooleanField')(default=True)),
            ('ui', self.gf('ox.django.fields.DictField')(default={})),
            ('preferences', self.gf('ox.django.fields.DictField')(default={})),
            ('notes', self.gf('django.db.models.fields.TextField')(default='')),
        ))
        db.send_create_signal('user', ['UserProfile'])


    def backwards(self, orm):
        # Deleting model 'SessionData'
        db.delete_table('user_sessiondata')

        # Deleting model 'UserProfile'
        db.delete_table('user_userprofile')


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
        'user.sessiondata': {
            'Meta': {'object_name': 'SessionData'},
            'browser': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True'}),
            'firstseen': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'db_index': 'True', 'blank': 'True'}),
            'groupssort': ('django.db.models.fields.CharField', [], {'default': 'None', 'max_length': '255', 'null': 'True', 'blank': 'True'}),
            'info': ('ox.django.fields.DictField', [], {'default': '{}'}),
            'ip': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True'}),
            'lastseen': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now', 'db_index': 'True'}),
            'level': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'location': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True'}),
            'location_sort': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True'}),
            'numberoflists': ('django.db.models.fields.IntegerField', [], {'default': '0', 'null': 'True'}),
            'screensize': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True'}),
            'session_key': ('django.db.models.fields.CharField', [], {'max_length': '40', 'primary_key': 'True'}),
            'system': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True'}),
            'timesseen': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'data'", 'unique': 'True', 'null': 'True', 'to': "orm['auth.User']"}),
            'useragent': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True', 'db_index': 'True'}),
            'windowsize': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True'})
        },
        'user.userprofile': {
            'Meta': {'object_name': 'UserProfile'},
            'files_updated': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'level': ('django.db.models.fields.IntegerField', [], {'default': '1'}),
            'newsletter': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'notes': ('django.db.models.fields.TextField', [], {'default': "''"}),
            'preferences': ('ox.django.fields.DictField', [], {'default': '{}'}),
            'reset_code': ('django.db.models.fields.CharField', [], {'max_length': '255', 'unique': 'True', 'null': 'True', 'blank': 'True'}),
            'ui': ('ox.django.fields.DictField', [], {'default': '{}'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'profile'", 'unique': 'True', 'to': "orm['auth.User']"})
        }
    }

    complete_apps = ['user']