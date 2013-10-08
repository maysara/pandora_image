# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement
import os
import re
import subprocess
from urllib import quote, unquote

from django.db import models
from django.db.models import Max
from django.contrib.auth.models import User
from django.db.models.signals import pre_delete

import Image
import ox

from item.models import Item

import managers


class Document(models.Model):

    class Meta:
        unique_together = ("user", "name", "extension")

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    user = models.ForeignKey(User, related_name='files')
    name = models.CharField(max_length=255)
    extension = models.CharField(max_length=255)
    size = models.IntegerField(default=0)
    matches = models.IntegerField(default=0)
    ratio = models.FloatField(default=1)
    description = models.TextField(default="")
    oshash = models.CharField(max_length=16, unique=True, null=True)

    file = models.FileField(default=None, blank=True,null=True, upload_to=lambda f, x: f.path(x))

    objects = managers.DocumentManager()
    uploading = models.BooleanField(default = False)

    name_sort = models.CharField(max_length=255)
    description_sort = models.CharField(max_length=512)

    items = models.ManyToManyField(Item, through='ItemProperties', related_name='documents')

    def save(self, *args, **kwargs):
        if not self.uploading:
            if self.file:
                self.size = self.file.size
                if self.extension == 'pdf' and not os.path.exists(self.thumbnail()):
                    self.make_thumbnail()

        self.name_sort = ox.sort_string(self.name or u'')[:255].lower()
        self.description_sort = ox.sort_string(self.description or u'')[:512].lower()

        super(Document, self).save(*args, **kwargs)

    def __unicode__(self):
        return self.get_id()

    def add(self, item):
        p, created = ItemProperties.objects.get_or_create(item=item, document=self)
        if created:
            p.index = ItemProperties.objects.filter(item=item).aggregate(Max('index'))['index__max'] + 1
            p.save()

    def remove(self, item):
        ItemProperties.objects.filter(item=item, document=self).delete()

    @classmethod
    def get(cls, id):
        username, name, extension = cls.parse_id(id)
        return cls.objects.get(user__username=username, name=name, extension=extension)

    @classmethod
    def parse_id(cls, id):
        public_id = id.split(':')
        username = public_id[0]
        name = ":".join(public_id[1:])
        extension = name.split('.')
        name = '.'.join(extension[:-1])
        extension = extension[-1].lower()
        return username, name, extension

    def get_absolute_url(self):
        return ('/documents/%s' % quote(self.get_id())).replace('%3A', ':')

    def get_id(self):
        return u'%s:%s.%s' % (self.user.username, self.name, self.extension)

    def editable(self, user):
        if not user or user.is_anonymous():
            return False
        if self.user == user or \
           user.is_staff or \
           user.get_profile().capability('canEditDocuments') == True:
            return True
        return False

    def edit(self, data, user, item=None):
        for key in data:
            if key == 'name':
                data['name'] = re.sub(' \[\d+\]$', '', data['name']).strip()
                if not data['name']:
                    data['name'] = "Untitled"
                name = data['name']
                num = 1
                while Document.objects.filter(name=name, user=self.user, extension=self.extension).exclude(id=self.id).count()>0:
                    num += 1
                    name = data['name'] + ' [%d]' % num
                self.name = name
            elif key == 'description' and not item:
                self.description = ox.sanitize_html(data['description'])
        if item:
            p, created = ItemProperties.objects.get_or_create(item=item, document=self)
            if 'description' in data:
                p.description = ox.sanitize_html(data['description'])
                p.save()

    def json(self, keys=None, user=None, item=None):
        if not keys:
             keys=[
                'description',
                'editable',
                'id',
                'name',
                'extension',
                'oshash',
                'size',
                'ratio',
                'user'
            ]
        response = {}
        _map = {
        }
        for key in keys:
            if key == 'id':
                response[key] = self.get_id()
            elif key == 'editable':
                response[key] = self.editable(user)
            elif key == 'user':
                response[key] = self.user.username
            elif hasattr(self, _map.get(key, key)):
                response[key] = getattr(self, _map.get(key,key))
        if item:
            d = self.descriptions.filter(item=item)
            if d.exists():
                if 'description' in keys and d[0].description:
                    response['description'] = d[0].description
                response['index'] = d[0].index
        return response

    def path(self, name=''):
        h = "%07d" % self.id
        return os.path.join('documents', h[:2], h[2:4], h[4:6], h[6:], name)

    def save_chunk(self, chunk, chunk_id=-1, done=False):
        if self.uploading:
            if not self.file:
                name = 'data.%s' % self.extension
                self.file.name = self.path(name)
                ox.makedirs(os.path.dirname(self.file.path))
                with open(self.file.path, 'w') as f:
                    f.write(chunk.read())
                self.save()
            else:
                with open(self.file.path, 'a') as f:
                    f.write(chunk.read())
            if done:
                self.uploading = False
                self.get_ratio()
                self.oshash = ox.oshash(self.file.path)
                self.save()
            return True
        return False

    def thumbnail(self):
        return '%s.jpg' % self.file.path

    def make_thumbnail(self, force=False):
        thumb = self.thumbnail()
        if not os.path.exists(thumb) or force:
            cmd = ['convert', '%s[0]' % self.file.path,
                '-background', 'white', '-flatten', '-resize', '256x256', thumb]
            p = subprocess.Popen(cmd)
            p.wait()

    def get_ratio(self):
        if self.extension == 'pdf':
            self.make_thumbnail()
            image = self.thumbnail()
        else:
            image = self.file.path
        try:
            size = Image.open(image).size
        except:
            size = [1,1]
        self.ratio = size[0] / size[1]

    def update_matches(self):
        import annotation.models
        import item.models
        import text.models
        urls = [self.get_absolute_url()]
        url = unquote(urls[0])
        if url != urls[0]:
            urls.append(url)
        matches = 0
        for url in urls:
            matches += annotation.models.Annotation.objects.filter(value__contains=url).count()
            matches += item.models.Item.objects.filter(data__contains=url).count()
            matches += text.models.Text.objects.filter(text__contains=url).count()
        if matches != self.matches:
            Document.objects.filter(id=self.id).update(matches=matches)
            self.matches = matches

def delete_document(sender, **kwargs):
    t = kwargs['instance']
    if t.file:
        if t.extension == 'pdf':
            thumb = t.thumbnail()
            if os.path.exists(thumb):
                os.unlink(thumb)
        t.file.delete()
pre_delete.connect(delete_document, sender=Document)

class ItemProperties(models.Model):

    class Meta:
        unique_together = ("item", "document")

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    item = models.ForeignKey(Item)
    document = models.ForeignKey(Document, related_name='descriptions')
    description = models.TextField(default="")
    index = models.IntegerField(default=0)

