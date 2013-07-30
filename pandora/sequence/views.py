# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from ox.utils import json
from ox.django.shortcuts import render_to_json_response, json_response

from ox.django.api import actions

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
    query['qs'] = models.Sequence.objects.find(query, user)
    if 'itemsQuery' in data and data['itemsQuery'].get('conditions'):
        item_query = Item.objects.find({'query': data['itemsQuery']}, user)
        query['qs'] = query['qs'].filter(item__in=item_query)
    return query

def order_query(qs, sort):
    order_by = []
    sort += [
        {'key': 'in', 'operator': '-'},
    ]
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
            'in': 'start',
            'out': 'end',
            'position': 'start',
        }.get(e['key'], e['key'])
        if key not in ('duration', 'start', 'end', 'mode', 'hash'):
            key = 'sort__%s' % key
        order = '%s%s' % (operator, key)
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by, nulls_last=True)
    return qs

def findSequences(request):
    '''
        takes {
            query: ...
            itemsQuery: ...
        }

        one of your conditions has to be key: 'mode', value: [shape,color], operator: '=='

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
        response['data']['items'] = [p.json(data['keys'], request.user) for p in qs]
    elif 'position' in query:
        qs = order_query(qs, query['sort'])
        ids = [i['public_id'] for i in qs.values('public_id')]
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
        ids = [i['public_id'] for i in qs.values('public_id')]
        response['data']['positions'] = utils.get_positions(ids, data['positions'])
    else:
        response['data']['items'] = qs.count()
    return render_to_json_response(response)
actions.register(findSequences)

def getSequence(request):
    '''
        takes {
            id
            mode 
            position
        }

        returns {
            id
            mode
            in
            out
        }
    '''
    data = json.loads(request.POST['data'])
    response = json_response()
    position = float('%0.03f' % data['position'])
    i = Item.objects.get(itemId=data['id'])
    qs = models.Sequence.objects.filter(
        sort_id=i.sort.pk,
        mode=models.Sequence.MODE[data['mode']], 
        start__lte=position,
        end__gt=position
    ).order_by('start', 'end')
    for sequence in qs:
        response['data'] = sequence.json()
        break
    return render_to_json_response(response)
actions.register(getSequence)
