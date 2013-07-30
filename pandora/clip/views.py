# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from django.conf import settings
from ox.utils import json
from ox.django.shortcuts import render_to_json_response, json_response

from ox.django.api import actions

from annotation.models import Annotation
from item.models import Item
from item import utils

import models


def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'in', 'operator':'+'}]
    for key in ('keys', 'group', 'range', 'sort', 'query'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Clip.objects.find(query, user)
    query['filter'] = models.Clip.objects.filter_annotations(query, user)
    if 'itemsQuery' in data and data['itemsQuery'].get('conditions'):
        item_query = Item.objects.find({'query': data['itemsQuery']}, user)
        query['qs'] = query['qs'].filter(item__in=item_query)
    return query

def order_query(qs, sort):
    order_by = []
    sort += [
        {'key': 'position', 'operator': '+'},
        {'key': 'text', 'operator': '-'}
    ]
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        clip_keys = ('public_id', 'start', 'end', 'hue', 'saturation', 'lightness', 'volume',
                     'duration', 'sortvalue', 'videoRatio',
                     'random__random')
        key = {
            'id': 'public_id',
            'in': 'start',
            'out': 'end',
            'position': 'start',
            'text': 'sortvalue',
            'videoRatio': 'aspect_ratio',
            'random': 'random__random',
        }.get(e['key'], e['key'])
        if key.startswith('clip:'):
            key = e['key'][len('clip:'):]
            key = {
                'text': 'sortvalue',
                'position': 'start',
            }.get(key, key)
        elif key not in clip_keys:
            #key mgith need to be changed, see order_sort in item/views.py
            key = "sort__%s" % key
        if key == 'public_id':
            order_by.append('%s%s' % (operator, 'sort__itemId'))
            order_by.append('%s%s' % (operator, 'start'))
            order_by.append('end')
        else:
            order = '%s%s' % (operator, key)
            order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by, nulls_last=True)
    return qs

def findClips(request):
    '''
        takes {
            query: {
                conditions: [object],
                operator: string // '&' or '|'
            },
            itemsQuery: {
                conditions: [],
                operator: string // '&' or '|'
            },
            keys: [string],
            position: int,
            positions: [string],
            range: [int, int],
            sort: []
        }

        returns {
            items: [object]
        }
    '''
    data = json.loads(request.POST['data'])
    response = json_response()

    query = parse_query(data, request.user)
    qs = query['qs']
    if 'keys' in data:
        qs = order_query(qs, query['sort'])
        qs = qs[query['range'][0]:query['range'][1]]

        ids = []
        keys = filter(lambda k: k not in settings.CONFIG['clipLayers'] + ['annotations'],
                      data['keys'])
        if filter(lambda k: k not in models.Clip.clip_keys, keys):
            qs = qs.select_related('sort')

        def add(p):
            ids.append(p.id)
            return p.json(keys=keys)

        response['data']['items'] = [add(p) for p in qs]
        keys = data['keys']

        def clip_public_id(c):
            return u'%s/%0.03f-%0.03f' % (c['public_id'].split('/')[0], c['clip__start'], c['clip__end'])

        def add_annotations(key, qs, add_layer=False):
            values = ['public_id', 'value', 'clip__start', 'clip__end']
            subtitles = utils.get_by_key(settings.CONFIG['layers'], 'isSubtitles', True)
            if subtitles or add_layer:
                values.append('layer')
            if query['filter']:
                qs = qs.filter(query['filter'])
            for a in qs.values(*values):
                public_id = clip_public_id(a)
                for i in response['data']['items']:
                    if i['id'] == public_id:
                        if not key in i:
                            i[key] = []
                        l = {
                            'id': a['public_id'],
                            'value': a['value'],
                        }
                        if subtitles and a['layer'] == subtitles['id'] and not a['value']:
                            del l['id']
                        if add_layer:
                            l['layer'] = a['layer']
                        i[key].append(l)
        if response['data']['items']:
            if 'annotations' in keys:
                aqs = Annotation.objects.filter(layer__in=settings.CONFIG['clipLayers'],
                                                clip__in=ids)
                add_annotations('annotations',aqs , True)
            for layer in filter(lambda l: l in keys, settings.CONFIG['clipLayers']):
                aqs = Annotation.objects.filter(layer=layer, clip__in=ids)
                add_annotations(layer, aqs)
    elif 'position' in query:
        qs = order_query(qs, query['sort'])
        ids = [u'%s/%0.03f-%0.03f' % (c['item__itemId'], c['start'], c['end'])
            for c in qs.values('item__itemId', 'start', 'end')]
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
        qs = order_query(qs, query['sort'])
        ids = [u'%s/%0.03f-%0.03f' % (c['item__itemId'], c['start'], c['end'])
            for c in qs.values('item__itemId', 'start', 'end')]
        response['data']['positions'] = utils.get_positions(ids, data['positions'])
    else:
        response['data']['items'] = qs.count()
    return render_to_json_response(response)
actions.register(findClips)
