# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from ox.utils import json
from ox.django.api import actions
from ox.django.decorators import login_required_json
from ox.django.http import HttpFileResponse
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response
from django import forms

from item import utils
from item.models import Item
import models

def get_document_or_404_json(id):
    username, name, extension = models.Document.parse_id(id)
    return get_object_or_404_json(models.Document, user__username=username, name=name, extension=extension)

@login_required_json
def addDocument(request):
    '''
        add document(s) to item
        takes {
            item: string
            id: string
            or
            ids: [string]
        }
        returns {
        }
    '''
    response = json_response()
    data = json.loads(request.POST['data'])
    if 'ids' in data:
        ids = data['ids']
    else:
        ids = [data['id']]
    item = Item.objects.get(itemId=data['item'])
    if item.editable(request.user):
        for id in ids:
            document = models.Document.get(id)
            document.add(item)
    else:
        response = json_response(status=403, file='permission denied')
    return render_to_json_response(response)
actions.register(addDocument, cache=False)

@login_required_json
def editDocument(request):
    '''
        takes {
            id: string
            name: string
            description: string
            item(optional): edit descriptoin per item
        }
        returns {
            id:
            ...
        }
    '''
    response = json_response()
    data = json.loads(request.POST['data'])
    item = 'item' in data and Item.objects.get(itemId=data['item']) or None
    if data['id']:
        document = models.Document.get(data['id'])
        if document.editable(request.user):
            document.edit(data, request.user, item=item)
            document.save()
            response['data'] = document.json(user=request.user, item=item)
        else:
            response = json_response(status=403, text='permission denied')
    else:
        response = json_response(status=500, text='invalid request')
    return render_to_json_response(response)
actions.register(editDocument, cache=False)


def _order_query(qs, sort):
    order_by = []
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
            'name': 'name_sort',
            'description': 'description_sort',
        }.get(e['key'], e['key'])
        order = '%s%s' % (operator, key)
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by)
    qs = qs.distinct()
    return qs

def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'user', 'operator':'+'}, {'key':'name', 'operator':'+'}]
    for key in ('keys', 'group', 'file', 'range', 'position', 'positions', 'sort'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Document.objects.find(data, user).exclude(name='')
    return query


def findDocuments(request):
    '''
        takes {
            query: {
                conditions: [
                    {
                        key: 'user',
                        value: 'something',
                        operator: '='
                    }
                ]
                operator: ","
            },
            sort: [{key: 'name', operator: '+'}],
            range: [0, 100]
            keys: []
        }

        possible query keys:
            name, user, extension, size

        possible keys:
            name, user, extension, size

        }
        returns {
            items: [object]
        }
    '''
    data = json.loads(request.POST['data'])
    query = parse_query(data, request.user)

    #order
    qs = _order_query(query['qs'], query['sort'])
    response = json_response()
    if 'keys' in data:
        qs = qs[query['range'][0]:query['range'][1]]

        response['data']['items'] = [l.json(data['keys'], request.user) for l in qs]
    elif 'position' in data:
        #FIXME: actually implement position requests
        response['data']['position'] = 0
    elif 'positions' in data:
        ids = [i.get_id() for i in qs]
        response['data']['positions'] = utils.get_positions(ids, query['positions'])
    else:
        response['data']['items'] = qs.count()
    return render_to_json_response(response)
actions.register(findDocuments)

@login_required_json
def removeDocument(request):
    '''
        takes {
            id: string,
            or
            ids: [string]
            item: string
        }

        if item is passed, remove relation to item
        otherwise remove document
        returns {
        }
    '''
    data = json.loads(request.POST['data'])
    response = json_response()

    if 'ids' in data:
        ids = data['ids']
    else:
        ids = [data['id']]
    item = 'item' in data and Item.objects.get(itemId=data['item']) or None
    if item:
        if item.editable(request.user):
            for id in ids:
                document = models.Document.get(id)
                document.remove(item)
        else:
            response = json_response(status=403, text='not allowed')
    else:
        for id in ids:
            document = models.Document.get(id)
            if document.editable(request.user):
                document.delete()
            else:
                response = json_response(status=403, text='not allowed')
                break
    return render_to_json_response(response)
actions.register(removeDocument, cache=False)

@login_required_json
def sortDocuments(request):
    '''
        takes {
            item: string
            ids: [string]
        }
        returns {
        }
    '''
    data = json.loads(request.POST['data'])
    index = 0
    item = Item.objects.get(itemId=data['item'])
    ids = data['ids']
    if item.editable(request.user):
        for i in ids:
            document = models.Document.get(i)
            models.ItemProperties.objects.filter(item=item, document=document).update(index=index)
            index += 1
        response = json_response()
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(sortDocuments, cache=False)

def file(request, id):
    document = models.Document.get(id)
    return HttpFileResponse(document.file.path)

def thumbnail(request, id):
    document = models.Document.get(id)
    return HttpFileResponse(document.thumbnail())

class ChunkForm(forms.Form):
    chunk = forms.FileField()
    chunkId = forms.IntegerField(required=False)
    done = forms.IntegerField(required=False)

@login_required_json
def upload(request):
    if 'id' in request.GET:
        file = models.Document.get(request.GET['id'])
    else:
        extension = request.POST['filename'].split('.')
        name = '.'.join(extension[:-1])
        extension = extension[-1].lower()
    response = json_response(status=400, text='this request requires POST')
    if 'chunk' in request.FILES:
        form = ChunkForm(request.POST, request.FILES)
        if form.is_valid() and file.editable(request.user):
            c = form.cleaned_data['chunk']
            chunk_id = form.cleaned_data['chunkId']
            response = {
                'result': 1,
                'resultUrl': request.build_absolute_uri(file.get_absolute_url())
            }
            if not file.save_chunk(c, chunk_id, form.cleaned_data['done']):
                response['result'] = -1
            if form.cleaned_data['done']:
                response['done'] = 1
            return render_to_json_response(response)
    #init upload
    else:
        created = False
        num = 1
        _name = name
        while not created:
            file, created = models.Document.objects.get_or_create(
                user=request.user, name=name, extension=extension)
            if not created:
                num += 1
                name = _name + ' [%d]' % num
        file.name = name
        file.extension = extension
        file.uploading = True
        file.save()
        upload_url = request.build_absolute_uri('/api/upload/document?id=%s' % file.get_id())
        return render_to_json_response({
            'uploadUrl': upload_url,
            'url': request.build_absolute_uri(file.get_absolute_url()),
            'result': 1
        })
    return render_to_json_response(response)
