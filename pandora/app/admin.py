# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.contrib import admin

import models


class PageAdmin(admin.ModelAdmin):
    search_fields = ['name', 'body']

admin.site.register(models.Page, PageAdmin)

