# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from django.db.models import Max, Min, Count
from django.conf import settings

import ox
from ox.utils import json

from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response

from ox.django.api import actions
from item import utils

import models

@login_required_json
def addPlace(request):
    '''
        takes {
            name: "",
            alternativeNames: [],
            geoname: "",
            countryCode: '',
            south: float,
            west: float,
            north: float,
            east: float,
            lat: float,
            lng: float,
            area: float,
            type: ""
        }
        returns {
            id: string
        }
    '''
    #FIXME: check permissions
    data = json.loads(request.POST['data'])
    exists = False
    existing_names = []
    existing_geoname = ''
    name = data.pop('name')
    if name == '':
        _exists = True
        name = 'Untitled'
        n = 0
        while _exists:
            _exists = models.Place.objects.filter(defined=True,
                                name_find__icontains=u'|%s|'%name).count() > 0
            if _exists:
                name = 'Untitled [%s]' %n
            n += 1
    names = [name] + data.get('alternativeNames', [])
    data['alternativeNames'] = [ox.escape_html(n)
            for n in data.get('alternativeNames', [])]
    name = ox.escape_html(name)
    for n in names:
        n = ox.decode_html(name)
        if models.Place.objects.filter(defined=True,
                                       name_find__icontains=u'|%s|'%n).count() != 0:
            exists = True
            existing_names.append(n)
    '''
    if 'geoname' in data: 
        if models.Place.objects.filter(defined=True,
                                       geoname=data['geoname']).count() > 0:
            exists = True
            existing_geoname = data['geoname']
    '''
    if not exists:
        models.Place.objects.filter(defined=False, name__in=names).delete()
        place = models.Place()
        place.user = request.user
        place.name = name
        place.alternativeNames = tuple(data.pop('alternativeNames', []))
        for key in data:
            value = data[key]
            if isinstance(value, list):
                value = tuple(value)
            setattr(place, key, value)
        place.matches = 0
        place.save()
        place.update_matches()
        response = json_response(place.json())
    else:
        response = json_response(status=409,
                                 text='%s exists'%(existing_names and 'Name' or 'Geoname'))
        response['data']['names'] = existing_names
        if existing_geoname:
            response['data']['geoname'] = existing_geoname
    return render_to_json_response(response)
actions.register(addPlace, cache=False)


@login_required_json
def editPlace(request):
    '''
        takes {
            id: string,
            name: string
            north: int
        }
        returns {
            names: []
        }
    '''
    data = json.loads(request.POST['data'])
    place = get_object_or_404_json(models.Place, pk=ox.fromAZ(data['id']))
    names = data.get('name', [])
    if isinstance(names, basestring):
        names = [names]
    names = [ox.escape_html(n) for n in names]
    alternative_names = [ox.escape_html(n) for n in data.get('alternativeNames', [])]
    alternative_names = filter(lambda n: n.strip(), alternative_names)
    if place.editable(request.user):
        conflict = False
        conflict_names = []
        conflict_geoname = ''
        if alternative_names:
            data['alternativeNames'] = alternative_names
        for name in names + alternative_names:
            name = ox.decode_html(name)
            if models.Place.objects.filter(defined=True,
                    name_find__icontains=u'|%s|'%name).exclude(id=place.id).count() != 0:
                conflict = True
                conflict_names.append(name)
        '''
        if 'geoname' in data:
            if models.Place.objects.filter(defined=True,
                        geoname=data['geoname']).exclude(id=place.id).count() != 0:
                conflict = True
                conflict_geoname = data['geoname']
        '''
        if not conflict:
            models.Place.objects.filter(defined=False, name__in=names+alternative_names).delete()
            for key in data:
                if key != 'id':
                    value = data[key]
                    if isinstance(value, basestring):
                        value = ox.escape_html(value)
                    if isinstance(value, list):
                        value = tuple(value)
                    setattr(place, key, value)
            place.save()
            if 'name' in data or 'alternativeNames' in data:
                place.update_matches()
            response = json_response(place.json())
        else:
            response = json_response(status=409,
                                     text='%s exists'%(conflict_names and 'Name' or 'Geoname'))
            response['data']['names'] = conflict_names 
            if conflict_geoname:
                response['data']['geoname'] = conflict_geoname
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(editPlace, cache=False)


@login_required_json
def removePlace(request):
    '''
        takes {
            id: string,
        }
        returns {}
    '''
    data = json.loads(request.POST['data'])
    if isinstance(data, dict):
        data = data['id']
    place = get_object_or_404_json(models.Place, pk=ox.fromAZ(data))
    if place.editable(request.user):
        place.delete()
        response = json_response(status=200, text='deleted')
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(removePlace, cache=False)

def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'name', 'operator':'+'}]
    for key in ('keys', 'group', 'list', 'range', 'sort', 'query'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Place.objects.find(query, user)
    if 'itemsQuery' in data:
        item_query = models.Item.objects.find({'query': data['itemsQuery']}, user)
        query['qs'] = query['qs'].filter(items__in=item_query)
    return query

def order_query(qs, sort):
    order_by = []
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
            'name': 'name_sort',
            'geoname': 'geoname_sort',
        }.get(e['key'], e['key'])
        order = '%s%s' % (operator, key)
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by, nulls_last=True)
    return qs

def findPlaces(request):
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
            itemsQuery: {
                //see find request
            },
            sort: [{key: 'name', operator: '+'}],
            range: [int, int]
            keys: [string]
        }

        possible query keys:
            name, geoname, user

        itemsQuery can be used to limit the resuts to matches in those items.
                  Uses the same query syntax as used in the find request.

        possible keys:
            name, geoname, user
        
        returns {
            items: [object]
        }
        takes {
            query: object,
            sort: [object]
            range: [int, int]
        }
            query: query object, more on query syntax at
                   https://wiki.0x2620.org/wiki/pandora/QuerySyntax
            sort: array of key, operator dics
                [
                    {
                        key: "year",
                        operator: "-"
                    },
                    {
                        key: "director",
                        operator: ""
                    }
                ]
            range:       result range, array [from, to]

        with keys, items is list of dicts with requested properties:
        returns {
            items: [string]    
        }

Positions
        takes {
            query: object,
            positions: [string]
        }
        query: query object, more on query syntax at
               https://wiki.0x2620.org/wiki/pandora/QuerySyntax
        positions:  ids of places for which positions are required
    '''
    data = json.loads(request.POST['data'])
    response = json_response()

    query = parse_query(data, request.user)
    qs = order_query(query['qs'], query['sort'])
    qs = qs.distinct()
    if 'keys' in data:
        qs = qs.select_related('user__profile')
        qs = qs[query['range'][0]:query['range'][1]]
        response['data']['items'] = [p.json(data['keys'], request.user) for p in qs]
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
        ids = [i.get_id() for i in qs]
        response['data']['positions'] = utils.get_positions(ids, data['positions'])
    else:
        response['data']['items'] = qs.count()
        response['data']['area'] = qs.aggregate(
            south=Min('south'),
            west=Min('west'),
            north=Max('north'),
            east=Max('east'),
        )
    return render_to_json_response(response)
actions.register(findPlaces)

def getPlaceNames(request):
    '''
        takes {}
        returns {
            items: [{name: string, matches: int}]
        }
    '''
    response = json_response({})
    layers = [l['id'] for l in filter(lambda l: l['type'] == 'place',
                                      settings.CONFIG['layers'])]
    items = models.Annotation.objects.filter(layer__in=layers,
                                             places__id=None).order_by('value')
    items = items.values('value').annotate(Count('value'))
    response['data']['items'] = [{
        'name': i['value'],
        'matches': i['value__count']
    } for i in items]
    return render_to_json_response(response)
actions.register(getPlaceNames)
