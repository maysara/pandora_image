# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.conf.urls.defaults import *


urlpatterns = patterns("item.views",
    #frames
    (r'^(?P<id>[A-Z0-9].*)/(?P<size>\d+)p(?P<position>[\d\.]*)\.jpg$', 'frame'),

    #timelines
    (r'^(?P<id>[A-Z0-9].*)/timeline(?P<mode>[a-z]*)(?P<size>\d+)p(?P<position>\d+)\.(?P<format>png|jpg)$', 'timeline'),
    (r'^(?P<id>[A-Z0-9].*)/timeline(?P<mode>[a-z]*)(?P<size>\d+)p\.(?P<format>png|jpg)$', 'timeline'),

    #video
    (r'^(?P<id>[A-Z0-9].*)/(?P<resolution>\d+)p(?P<index>\d*)\.(?P<format>webm|ogv|mp4)$', 'video'),

    #torrent
    (r'^(?P<id>[A-Z0-9].*)/torrent$', 'torrent'),
    (r'^(?P<id>[A-Z0-9].*)/torrent/(?P<filename>.*?)$', 'torrent'),

    #download
    (r'^(?P<id>[A-Z0-9].*)/download/$', 'download'),

    #export
    (r'^(?P<id>[A-Z0-9].*)/json$', 'item_json'),
    (r'^(?P<id>[A-Z0-9].*)/xml$', 'item_xml'),

    #srt export
    (r'^(?P<id>[A-Z0-9].*)/(?P<layer>.+)\.srt$', 'srt'),

    #icon
    (r'^(?P<id>[A-Z0-9].*)/icon(?P<size>\d*)\.jpg$', 'icon'),

    #poster
    (r'^(?P<id>[A-Z0-9].*)/posterframe(?P<position>\d+).jpg$', 'poster_frame'),
    (r'^(?P<id>[A-Z0-9].*)/poster(?P<size>\d+)\.jpg$', 'poster'),
    (r'^(?P<id>[A-Z0-9].*)/siteposter(?P<size>\d*)\.jpg$', 'siteposter'),
    (r'^(?P<id>[A-Z0-9].*)/poster\.jpg$', 'siteposter'),

    (r'^random$', 'random_annotation'),
)
