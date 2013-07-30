# Create your views here.
from urllib import quote
import re

from django.shortcuts import get_object_or_404, redirect

import models

def padma_find(request):
    url = '/'
    l = request.GET.get('l', None)
    q = request.GET.get('q', None)
    f = request.GET.get('f', '')
    s = request.GET.get('s', None)
    v = request.GET.get('v', None)
    if l:
        alias = get_object_or_404(models.ListAlias, old=l)
        if alias:
            url = '/list=%s' % alias.new
    if f:
        f = {
            'transcript': 'transcripts',
            'location': 'places',
            'description': 'descriptions',
            'keyword': 'keywords',
        }.get(f, f)
    if v != 'map':
        v = 'grid'
    if not f:
        f = '*'
    if q:
        url = '/%s=%s' % (f, quote(q))
    if s:
        url = '/%s%s' % (s, url)
    if url != '/':
        url = '/%s%s' % (v, url)
    return redirect(url, permanent=True)

def padma_video(request, url):
    url = url.split('/')
    hid = url[0]
    view = None
    layer = None
    if len(url) > 1:
        view = url[1]
        if len(url) > 2:
            layer = url[2]
        elif view.startswith('L'):
            layer = view
            view = None
    if layer:
        alias = get_object_or_404(models.LayerAlias, old=layer)
        url = '/%s' % alias.new
    else:
        alias = get_object_or_404(models.IDAlias, old=hid)
        url = '/%s' % alias.new
    if view:
        timecodes = re.compile('(\d{2}:\d{2}:\d{2}\.\d{3})-(\d{2}:\d{2}:\d{2}\.\d{3})').findall(view)
        if timecodes:
            view = ','.join(timecodes[0])
    if view:
        url += '/' + {
            'editor': 'timeline',
        }.get(view, view)
    #FIXME: reqrite layer urls
    #FIXME: rewrite timerange urls
    return redirect(url, permanent=True)

