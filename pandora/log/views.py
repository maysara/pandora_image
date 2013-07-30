# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

import ox
from ox.utils import json

from ox.django.decorators import admin_required_json
from ox.django.shortcuts import render_to_json_response, json_response

from ox.django.api import actions

from item import utils

import models


def log(request):
    '''
        takes {
            url: string,
            line: string,
            text: string
        }
        returns {
        }
    '''
    data = json.loads(request.POST['data'])
    if request.user.is_authenticated():
        user = request.user
    else:
        user = None
    url = data.get('url', '').split('/static/')[-1]
    if 'text' in data:
        l = models.Log(
            text=data['text'],
            line=int(data.get('line', 0)),
            url=url
        )
        if user:
            l.user = user
        l.save()
    response = json_response()
    return render_to_json_response(response)
actions.register(log, cache=False)


@admin_required_json
def removeLogs(request):
    '''
        takes {
            ids: [string]
        }
        returns {}
    '''
    data = json.loads(request.POST['data'])
    models.Log.objects.filter(id__in=[ox.fromAZ(i) for i in data['ids']]).delete()
    response = json_response()
    return render_to_json_response(response)
actions.register(removeLogs, cache=False)

def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'name', 'operator':'+'}]
    for key in ('keys', 'group', 'list', 'range', 'sort', 'query'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Log.objects.find(query, user)
    return query

def order_query(qs, sort):
    order_by = []
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
        }.get(e['key'], e['key'])
        order = '%s%s' % (operator, key)
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by, nulls_last=True)
    return qs

@admin_required_json
def findLogs(request):
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
            sort: [{key: 'created', operator: '+'}],
            range: [int, int]
            keys: [string]
        }
        returns {
            items: [object]
        }

    '''
    data = json.loads(request.POST['data'])
    response = json_response()

    query = parse_query(data, request.user)
    qs = order_query(query['qs'], query['sort'])
    qs = qs.distinct()
    if 'keys' in data:
        qs = qs.select_related()
        qs = qs[query['range'][0]:query['range'][1]]
        response['data']['items'] = [p.json(data['keys']) for p in qs]
    elif 'position' in query:
        ids = [i.get_id() for i in qs]
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
        ids = [ox.toAZ(i.id) for i in qs]
        response['data']['positions'] = utils.get_positions(ids, data['positions'])
    else:
        response['data']['items'] = qs.count()
    return render_to_json_response(response)
actions.register(findLogs)
