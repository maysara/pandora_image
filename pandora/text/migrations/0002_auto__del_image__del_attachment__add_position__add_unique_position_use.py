# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Deleting model 'Image'
        db.delete_table('text_image')

        # Deleting model 'Attachment'
        db.delete_table('text_attachment')

        # Adding model 'Position'
        db.create_table('text_position', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('text', self.gf('django.db.models.fields.related.ForeignKey')(related_name='position', to=orm['text.Text'])),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(related_name='text_position', to=orm['auth.User'])),
            ('section', self.gf('django.db.models.fields.CharField')(max_length='255')),
            ('position', self.gf('django.db.models.fields.IntegerField')(default=0)),
        ))
        db.send_create_signal('text', ['Position'])

        # Adding unique constraint on 'Position', fields ['user', 'text', 'section']
        db.create_unique('text_position', ['user_id', 'text_id', 'section'])

        # Deleting field 'Text.public'
        db.delete_column('text_text', 'public')

        # Deleting field 'Text.slug'
        db.delete_column('text_text', 'slug')

        # Deleting field 'Text.title'
        db.delete_column('text_text', 'title')

        # Deleting field 'Text.published'
        db.delete_column('text_text', 'published')

        # Adding field 'Text.name'
        db.add_column('text_text', 'name',
                      self.gf('django.db.models.fields.CharField')(default=datetime.datetime(2013, 2, 15, 0, 0), max_length=255),
                      keep_default=False)

        # Adding field 'Text.status'
        db.add_column('text_text', 'status',
                      self.gf('django.db.models.fields.CharField')(default='private', max_length=20),
                      keep_default=False)

        # Adding field 'Text.description'
        db.add_column('text_text', 'description',
                      self.gf('django.db.models.fields.TextField')(default=''),
                      keep_default=False)

        # Adding field 'Text.icon'
        db.add_column('text_text', 'icon',
                      self.gf('django.db.models.fields.files.ImageField')(default='', max_length=100, blank=True),
                      keep_default=False)

        # Adding field 'Text.poster_frames'
        db.add_column('text_text', 'poster_frames',
                      self.gf('ox.django.fields.TupleField')(default=[]),
                      keep_default=False)

        # Adding M2M table for field subscribed_users on 'Text'
        db.create_table('text_text_subscribed_users', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('text', models.ForeignKey(orm['text.text'], null=False)),
            ('user', models.ForeignKey(orm['auth.user'], null=False))
        ))
        db.create_unique('text_text_subscribed_users', ['text_id', 'user_id'])

        # Adding unique constraint on 'Text', fields ['user', 'name']
        db.create_unique('text_text', ['user_id', 'name'])


    def backwards(self, orm):
        # Removing unique constraint on 'Text', fields ['user', 'name']
        db.delete_unique('text_text', ['user_id', 'name'])

        # Removing unique constraint on 'Position', fields ['user', 'text', 'section']
        db.delete_unique('text_position', ['user_id', 'text_id', 'section'])

        # Adding model 'Image'
        db.create_table('text_image', (
            ('caption', self.gf('django.db.models.fields.CharField')(default='', max_length=255)),
            ('image', self.gf('django.db.models.fields.files.ImageField')(max_length=100)),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
        ))
        db.send_create_signal('text', ['Image'])

        # Adding model 'Attachment'
        db.create_table('text_attachment', (
            ('caption', self.gf('django.db.models.fields.CharField')(default='', max_length=255)),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('file', self.gf('django.db.models.fields.files.FileField')(max_length=100)),
        ))
        db.send_create_signal('text', ['Attachment'])

        # Deleting model 'Position'
        db.delete_table('text_position')

        # Adding field 'Text.public'
        db.add_column('text_text', 'public',
                      self.gf('django.db.models.fields.BooleanField')(default=False),
                      keep_default=False)

        # Adding field 'Text.slug'
        db.add_column('text_text', 'slug',
                      self.gf('django.db.models.fields.SlugField')(default='', max_length=50),
                      keep_default=False)

        # Adding field 'Text.title'
        db.add_column('text_text', 'title',
                      self.gf('django.db.models.fields.CharField')(max_length=1000, null=True),
                      keep_default=False)

        # Adding field 'Text.published'
        db.add_column('text_text', 'published',
                      self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime.now),
                      keep_default=False)

        # Deleting field 'Text.name'
        db.delete_column('text_text', 'name')

        # Deleting field 'Text.status'
        db.delete_column('text_text', 'status')

        # Deleting field 'Text.description'
        db.delete_column('text_text', 'description')

        # Deleting field 'Text.icon'
        db.delete_column('text_text', 'icon')

        # Deleting field 'Text.poster_frames'
        db.delete_column('text_text', 'poster_frames')

        # Removing M2M table for field subscribed_users on 'Text'
        db.delete_table('text_text_subscribed_users')


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
        'text.position': {
            'Meta': {'unique_together': "(('user', 'text', 'section'),)", 'object_name': 'Position'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'position': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'section': ('django.db.models.fields.CharField', [], {'max_length': "'255'"}),
            'text': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'position'", 'to': "orm['text.Text']"}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'text_position'", 'to': "orm['auth.User']"})
        },
        'text.text': {
            'Meta': {'unique_together': "(('user', 'name'),)", 'object_name': 'Text'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'default': "''"}),
            'icon': ('django.db.models.fields.files.ImageField', [], {'default': 'None', 'max_length': '100', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'poster_frames': ('ox.django.fields.TupleField', [], {'default': '[]'}),
            'status': ('django.db.models.fields.CharField', [], {'default': "'private'", 'max_length': '20'}),
            'subscribed_users': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'subscribed_texts'", 'symmetrical': 'False', 'to': "orm['auth.User']"}),
            'text': ('django.db.models.fields.TextField', [], {'default': "''"}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'texts'", 'to': "orm['auth.User']"})
        }
    }

    complete_apps = ['text']
