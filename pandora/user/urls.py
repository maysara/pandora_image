# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.conf.urls.defaults import *


urlpatterns = patterns("user.views",
    (r'^preferences', 'preferences'),
    (r'^login', 'login'),
    (r'^logout', 'logout'),
    (r'^register', 'register'),
)

