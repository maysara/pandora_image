# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import os

from django.conf.urls.defaults import *
from ox.django.http import HttpFileResponse

from django.conf import settings

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

import app.monkey_patch

import ox.django.api.urls

def serve_static_file(path, location, content_type):
    return HttpFileResponse(location, content_type=content_type)

urlpatterns = patterns('',
    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
    (r'^admin/', include(admin.site.urls)),
    (r'^api/upload/text/?$', 'text.views.upload'),
    (r'^api/upload/document/?$', 'document.views.upload'),
    (r'^api/upload/direct/?$', 'archive.views.direct_upload'),
    (r'^api/upload/?$', 'archive.views.firefogg_upload'),
    (r'^url=(?P<url>.*)$', 'app.views.redirect_url'),
    (r'^file/(?P<oshash>.*)$', 'archive.views.lookup_file'),
    (r'^api/?$', include(ox.django.api.urls)),
    (r'^resetUI$', 'user.views.reset_ui'),
    (r'^documents/(?P<id>.*?.pdf).jpg$', 'document.views.thumbnail'),
    (r'^documents/(?P<id>.*?.)$', 'document.views.file'),
    (r'^edit/(?P<id>.*?)/icon(?P<size>\d*).jpg$', 'edit.views.icon'),
    (r'^list/(?P<id>.*?)/icon(?P<size>\d*).jpg$', 'itemlist.views.icon'),
    (r'^text/(?P<id>.*?)/icon(?P<size>\d*).jpg$', 'text.views.icon'),
    (r'^texts/(?P<id>.*?)/text.pdf$', 'text.views.pdf'),
    (r'^texts/(?P<id>.*?)/text.pdf.html$', 'text.views.pdf_viewer'),
    (r'^robots.txt$', serve_static_file, {'location': os.path.join(settings.STATIC_ROOT, 'robots.txt'), 'content_type': 'text/plain'}),
    (r'^favicon.ico$', serve_static_file, {'location': os.path.join(settings.STATIC_ROOT, 'png/icon.16.png'), 'content_type': 'image/x-icon'}),
    (r'^opensearch.xml$', 'app.views.opensearch_xml'),
    (r'^oembed$', 'item.views.oembed'),
    (r'^atom.xml$', 'item.views.atom_xml'),
    (r'^robots.txt$', 'app.views.robots_txt'),
    (r'^sitemap.xml$', 'item.views.sitemap_xml'),
    (r'', include('item.urls')),
)
#if settings.DEBUG:
#sould this not be enabled by default? nginx should handle those
urlpatterns += patterns('',
    (r'^data/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT}),
    (r'^static/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': settings.STATIC_ROOT}),
)

urlpatterns += patterns('',
    (r'^(V[a-z0-9]*)$', 'urlalias.views.padma_video'),
    (r'^(V[a-z0-9]*/.*)$', 'urlalias.views.padma_video'),
    (r'^find$', 'urlalias.views.padma_find'),
)
urlpatterns += patterns('',
    (r'^(?P<id>[A-Z0-9].*)/embed', 'app.views.embed'),
    (r'^(?P<id>[A-Z0-9].*)$', 'item.views.item'),
    (r'^[a-z0-9].+$', 'app.views.index'),
    (r'^$', 'app.views.index'),
    (r'^.*$', 'app.views.index'),
)

