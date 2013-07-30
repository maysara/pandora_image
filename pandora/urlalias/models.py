from django.db import models


class IDAlias(models.Model):
    old = models.CharField(max_length=255, unique=True)
    new = models.CharField(max_length=255)

    def __unicode__(self):
        return u"%s=%s" % (self.old, self.new)

class LayerAlias(models.Model):
    old = models.CharField(max_length=255, unique=True)
    new = models.CharField(max_length=255)

    def __unicode__(self):
        return u"%s=%s" % (self.old, self.new)

class ListAlias(models.Model):

    old = models.CharField(max_length=255, unique=True)
    new = models.CharField(max_length=255)

    def __unicode__(self):
        return u"%s=%s" % (self.old, self.new)

class Alias(models.Model):
    url = models.CharField(max_length=255, unique=True)
    target = models.CharField(max_length=255)

    def __unicode__(self):
        return u"%s=%s" % (self.url, self.target)

