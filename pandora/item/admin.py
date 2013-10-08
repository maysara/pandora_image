# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.contrib import admin

import models


class ItemAdmin(admin.ModelAdmin):
    search_fields = ['itemId', 'data', 'external_data']
    list_display = ['rendered', 'itemId', '__unicode__']
    list_display_links = ('__unicode__', )

admin.site.register(models.Item, ItemAdmin)

