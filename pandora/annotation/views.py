# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from django.conf import settings

from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response


from ox.django.api import actions

from item import utils
from item.models import Item

import models
from tasks import update_item, add_annotations

def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'in', 'operator':'+'}]
    for key in ('keys', 'group', 'range', 'sort', 'query'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Annotation.objects.find(query, user)
    if 'itemsQuery' in data:
        item_query = Item.objects.find({'query': data['itemsQuery']}, user)
        query['qs'] = query['qs'].filter(item__in=item_query)
    return query

def annotation_sort_key(key):
    return {
        'text': 'value',
        'position': 'start',
    }.get(key, key)

def order_query(qs, sort):
    order_by = []
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
            'duration': 'clip__duration',
            'in': 'start',
            'lightness': 'clip__lightness',
            'out': 'end',
            'saturation': 'clip__saturation',
            'volume': 'clip__volume',
        }.get(e['key'], e['key'])
        if key.startswith('clip:'):
            key = annotation_sort_key(e['key'][len('clip:'):])
        elif key not in ('start', 'end', 'value') and not key.startswith('clip__'):
            #key mgith need to be changed, see order_sort in item/views.py
            key = "item__sort__%s" % key
        order = '%s%s' % (operator, key)
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by, nulls_last=True)
    return qs

def findAnnotations(request):
    '''
        takes {
            query: {
                conditions: [],
                operator: '&'
            },
            itemsQuery: {
                conditions: [],
                operator: '&'
            },
            keys: [],
            position: int,
            positions: [],
            range: [in, out],
            sort: []
        }
        returns {
            annotations = [{..}, {...}, ...]
        }
    '''
    data = json.loads(request.POST['data'])
    response = json_response()

    query = parse_query(data, request.user)
    qs = order_query(query['qs'], query['sort'])
    if 'keys' in data:
        qs = qs.select_related()[query['range'][0]:query['range'][1]]
        response['data']['items'] = [p.json(keys=data['keys']) for p in qs]
    elif 'position' in query:
        ids = [i.public_id for i in qs]
        data['conditions'] = data['conditions'] + {
            'value': data['position'],
            'key': query['sort'][0]['key'],
            'operator': '^'
        }
        query = parse_query(data, request.user)
        qs = order_query(query['qs'], query['sort'])
        if qs.count() > 0:
            response['data']['position'] = utils.get_positions(ids, [qs[0].itemId])[0]
    elif 'positions' in data:
        ids = [i.public_id for i in qs]
        response['data']['positions'] = utils.get_positions(ids, data['positions'])
    else:
        response['data']['items'] = qs.count()
    return render_to_json_response(response)
actions.register(findAnnotations)


@login_required_json
def addAnnotation(request):
    '''
        takes {
            item: itemId,
            layer: layerId,
            in: float,
            out: float,
            value: string
        }
        returns {
            id: string, //id of new annotation
            ...
        }
    '''
    data = json.loads(request.POST['data'])
    for key in ('item', 'layer', 'in', 'out', 'value'):
        if key not in data:
            return render_to_json_response(json_response(status=400,
                                                         text='invalid data'))

    item = get_object_or_404_json(Item, itemId=data['item'])
    
    layer_id = data['layer']
    layer = filter(lambda l: l['id'] == layer_id, settings.CONFIG['layers'])[0]
    if layer['canAddAnnotations'].get(request.user.get_profile().get_level()):
        annotation = models.Annotation(
            item=item,
            layer=layer_id,
            user=request.user,
            start=float(data['in']), end=float(data['out']),
            value=data['value'])
        annotation.save()
        update_item.delay(annotation.id)
        response = json_response(annotation.json())
        response['data']['editable'] = True
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(addAnnotation, cache=False)

@login_required_json
def addAnnotations(request):
    '''
        takes {
            item: itemId,
            layer: layerId,
            annotations: [{
                in: float,
                out: float,
                value: string
            }, ...]
        }
        returns {
            taskId: string
        }
    '''
    data = json.loads(request.POST['data'])
    for key in ('item', 'layer', 'annotations'):
        if key not in data:
            return render_to_json_response(json_response(status=400,
                                                         text='invalid data'))

    item = get_object_or_404_json(Item, itemId=data['item'])
    
    layer_id = data['layer']
    layer = filter(lambda l: l['id'] == layer_id, settings.CONFIG['layers'])[0]
    if item.editable(request.user) \
        and layer['canAddAnnotations'].get(request.user.get_profile().get_level()):
        response = json_response()
        data['user'] = request.user.username
        t = add_annotations.delay(data)
        response['data']['taskId'] = t.task_id
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(addAnnotations, cache=False)

@login_required_json
def removeAnnotation(request):
    '''
        takes {
            id: annotationId
        }
        returns {
        }
    '''
    response = json_response({})
    data = json.loads(request.POST['data'])
    a = get_object_or_404_json(models.Annotation, public_id=data['id'])
    if a.editable(request.user):
        a.log()
        a.delete()
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(removeAnnotation, cache=False)


@login_required_json
def editAnnotation(request):
    '''
        takes {
            id:,
            in: float,
            out: float,
            value: string,
        }
        returns {
            id:
            ...
        }
    '''
    response = json_response({})
    data = json.loads(request.POST['data'])
    a = get_object_or_404_json(models.Annotation, public_id=data['id'])
    if a.editable(request.user):
        a.log()
        for key in ('value', 'in', 'out'):
            if key in data:
                setattr(a, {
                    'in': 'start',
                    'out': 'end'
                }.get(key,key), data[key])
        a.save()
        #update sort/find tables async
        update_item.delay(a.id)
        response['data'] = a.json()
        response['data']['editable'] = True
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(editAnnotation, cache=False)

