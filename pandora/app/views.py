# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import copy
from datetime import datetime

from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.conf import settings
from django.http import HttpResponse

from ox.django.shortcuts import json_response, render_to_json_response
from ox.django.decorators import login_required_json

import ox
from ox.utils import json, ET

import models

from user.models import init_user

from ox.django.api import actions

def intro(request):
    context = RequestContext(request, {'settings': settings})
    return render_to_response('intro.html', context)

def index(request):
    title = settings.SITENAME
    text = settings.CONFIG['site']['description']
    page = request.path.split('/')
    if len(page) == 2:
        page = page[1]
    else:
        page = ''
    for p in settings.CONFIG['sitePages']:
        if p['id'] == page:
            title += ' - ' + p['title']
            text, created = models.Page.objects.get_or_create(name=page)
            text = text.text
    context = RequestContext(request, {
        'base_url': request.build_absolute_uri('/'),
        'settings': settings,
        'text': text,
        'title': title,
    })
    return render_to_response('index.html', context)

def embed(request, id):
    context = RequestContext(request, {
        'settings': settings
    })
    return render_to_response('embed.html', context)

def redirect_url(request, url):
    if request.META['QUERY_STRING']:
        url += "?" + request.META['QUERY_STRING']

    if settings.CONFIG.get('sendReferrer', False):
        return redirect(url)
    else:
        return HttpResponse('<script>document.location.href=%s;</script>'%json.dumps(url))

def opensearch_xml(request):
    osd = ET.Element('OpenSearchDescription')
    osd.attrib['xmlns']="http://a9.com/-/spec/opensearch/1.1/"
    e = ET.SubElement(osd, 'ShortName')
    e.text = settings.SITENAME
    e = ET.SubElement(osd, 'Description')
    e.text = settings.SITENAME
    e = ET.SubElement(osd, 'Image')
    e.attrib['height'] = '16'
    e.attrib['width'] = '16'
    e.attrib['type'] = 'image/x-icon'
    e.text = request.build_absolute_uri('/favicon.ico')
    e = ET.SubElement(osd, 'Url')
    e.attrib['type'] = 'text/html'
    e.attrib['method'] = 'GET'
    e.attrib['template'] = "%s*={searchTerms}" % request.build_absolute_uri('/')
    '''
    e = ET.SubElement(osd, 'Url')
    e.attrib['type'] = 'application/x-suggestions+json'
    e.attrib['method'] = 'GET'
    e.attrib['template'] = "%s?q={searchTerms}" % request.build_absolute_uri('/opensearch_suggest')
    '''
    return HttpResponse(
        '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(osd),
        'application/xml'
    )

def robots_txt(request, url):
    return HttpResponse(
        'User-agent: *\nDisallow:\nSitemap: %s\n' % request.build_absolute_uri('/sitemap.xml'),
        'text/plain'
    )

def getPage(request):
    '''
        takes {
            name: pagename
        }
        returns {
            name:
            text:
        }
    '''
    data = json.loads(request.POST['data'])
    if isinstance(data, basestring):
        name = data
    else:
        name = data['name']
    page, created = models.Page.objects.get_or_create(name=name)
    if created:
        page.text= ''
        page.save()
    response = json_response({'name': page.name, 'text': page.text})
    return render_to_json_response(response)
actions.register(getPage)


@login_required_json
def editPage(request):
    '''
        takes {
            name: pagename
            text: text
        }
        returns {
            name:
            text:
        }
    '''
    if request.user.get_profile().capability('canEditSitePages'):
        data = json.loads(request.POST['data'])
        page, created = models.Page.objects.get_or_create(name=data['name'])
        if not created:
            page.log()
        page.text = ox.sanitize_html(data['text'])
        page.save()
        response = json_response({'name': page.name, 'text': page.text})
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(editPage)


def init(request):
    '''
        takes {}
        returns {
            user: object
        }
    '''
    response = json_response({})
    config = copy.deepcopy(settings.CONFIG)
    del config['keys']

    if 'HTTP_ACCEPT_LANGUAGE' in request.META:
        response['data']['locale'] = request.META['HTTP_ACCEPT_LANGUAGE'].split(';')[0].split('-')[0]
    response['data']['site'] = config
    response['data']['user'] = init_user(request.user, request)
    request.session['last_init'] = str(datetime.now())
    return render_to_json_response(response)
actions.register(init)


def embedURL(request):
    '''
        
        takes {
            url
            maxwidth
            maxheight
        }
        returns {
            html
            ...
        }
    '''
    data = json.loads(request.POST['data'])
    response = json_response({})
    response['data'] = ox.get_embed_code(data['url'], data.get('maxwidth'), data.get('maxheight'))
    return render_to_json_response(response)
actions.register(embedURL)
