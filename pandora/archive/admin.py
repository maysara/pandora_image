# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.contrib import admin

import models


class FileAdmin(admin.ModelAdmin):
    search_fields = ['path','oshash', 'video_codec']
    list_display = ['available', 'wanted', 'selected', '__unicode__', 'itemId']
    list_display_links = ('__unicode__', )

    def itemId(self, obj):
        return '%s'%(obj.item.itemId)


admin.site.register(models.File, FileAdmin)


class InstanceAdmin(admin.ModelAdmin):
    search_fields = ['path', 'volume__name', 'file__oshash']

admin.site.register(models.Instance, InstanceAdmin)
