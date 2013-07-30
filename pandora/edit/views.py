# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division
import os
import re

import ox
from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response
from django.db import transaction
from django.db.models import Max
from ox.django.http import HttpFileResponse
from ox.django.api import actions

from item import utils

import models

def get_edit_or_404_json(id):
    id = id.split(':')
    username = id[0]
    name = ":".join(id[1:])
    return get_object_or_404_json(models.Edit, user__username=username, name=name)

@login_required_json
def addClips(request):
    '''
        takes {
            edit: string,
            index: int,
            clips: []
                item: string,
                in: float,
                out: float,
                annotation: string
        }
        add clips with item/in/out or annotation to edit with id
        clips are added at index or end if index is not provided
        returns {
        }
    '''
    response = json_response()
    data = json.loads(request.POST['data'])
    edit = get_edit_or_404_json(data['edit'])
    clips = []
    if edit.editable(request.user):
        index = data.get('index', edit.clips.count())
        for c in data['clips']:
            clip = edit.add_clip(c, index)
            index += 1
            if not clip:
                response = json_response(status=500, text='invalid in/out')
                return render_to_json_response(response)
            else:
                clips.append(clip.json(request.user))
        response['data']['clips'] = clips
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(addClips, cache=False)


@login_required_json
def removeClips(request):
    '''
       takes {
           edit: string
           ids: [string]
        }
        returns {
        }
    '''
    response = json_response()
    data = json.loads(request.POST['data'])
    edit = get_edit_or_404_json(data['edit'])
    if 'id' in data:
        ids = [data['id']]
    else:
        ids = data['ids']
    ids = map(ox.fromAZ, ids)
    if edit.editable(request.user):
        for clip in edit.clips.filter(id__in=ids):
            clip.delete()
        response['data'] = edit.json(user=request.user)
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(removeClips, cache=False)

@login_required_json
def editClip(request):
    '''
       takes {
           id: string,
           in: float
        }
        returns {
        }
    '''
    response = json_response()
    data = json.loads(request.POST['data'])
    clip = get_object_or_404_json(models.Clip, pk=ox.fromAZ(data['id']))
    valid = True
    if clip.edit.editable(request.user):
        for key in ('in', 'out'):
            if key in data:
                if clip.annotation:
                    clip.start = clip.annotation.start
                    clip.end = clip.annotation.end
                    clip.item = clip.annotation.item
                    clip.annotation = None
                setattr(clip, {'in': 'start', 'out': 'end'}.get(key), float(data[key]))
        if not clip.annotation:
            duration = clip.item.sort.duration
            if clip.start >= clip.end or clip.start >= duration or clip.end > duration:
                response = json_response(status=500, text='invalid in/out')
                valid = False
        if valid:
            clip.save()
            response['data'] = clip.json(user=request.user)
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(editClip, cache=False)

@login_required_json
def orderClips(request):
    '''
       takes {
           edit: string
           ids: [string]
        }
        returns {
        }
    '''
    data = json.loads(request.POST['data'])
    edit = get_edit_or_404_json(data['edit'])
    response = json_response()
    ids = map(ox.fromAZ, data['ids'])
    if edit.editable(request.user):
        index = 0
        with transaction.commit_on_success():
            for i in ids:
                models.Clip.objects.filter(edit=edit, id=i).update(index=index)
                index += 1
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(orderClips, cache=False)

def _order_clips(qs, sort):
    order_by = []
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = e['key']
        #fixme, random should be clip random
        if key not in ('in', 'out', 'position', 'hue', 'saturation', 'lightness', 'volume', 'duration', 'text'):
            key = "item__sort__%s" % key
        key = {
            'position': 'start',
            'in': 'start',
            'out': 'end',
            'text': 'annotation__sortvalue',
            'item__sort__item': 'item__sort__itemId',
        }.get(key, key)
        order = '%s%s' % (operator, key)
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by)
    qs = qs.distinct()
    return qs

def sortClips(request):
    '''
       takes {
           edit: string
           sort: obect
        }
        returns {
        }
    '''
    data = json.loads(request.POST['data'])
    edit = get_edit_or_404_json(data['edit'])
    response = json_response()
    clips = models.Clip.objects.filter(edit=edit)
    clips = _order_clips(clips, data['sort'])
    response['data']['clips'] = [ox.toAZ(c['id']) for c in clips.values('id')]
    return render_to_json_response(response)
actions.register(sortClips, cache=False)

def getEdit(request):
    '''
        takes {
            id:
        }
        returns {
            id:
            clips:
        }
    '''
    data = json.loads(request.POST['data'])
    if 'id' in data:
        edit = get_edit_or_404_json(data['id'])
        response = json_response()
        if edit.accessible(request.user):
            response['data'] = edit.json(user=request.user)
        else:
            response = json_response(status=403, text='not allowed')
    else:
        response = json_response(status=404, text='not found')
    return render_to_json_response(response)
actions.register(getEdit)

@login_required_json
def addEdit(request):
    '''
        takes {
            name
        }
        returns {
            ...
        }
    '''
    data = json.loads(request.POST['data'])
    data['name'] = re.sub(' \[\d+\]$', '', data.get('name', 'Untitled')).strip()
    name = data['name']
    if not name:
        name = "Untitled"
    num = 1
    created = False
    while not created:
        edit, created = models.Edit.objects.get_or_create(name=name, user=request.user)
        num += 1
        name = data['name'] + ' [%d]' % num

    del data['name']
    if data:
        edit.edit(data, request.user)
    else:
        edit.save()
    if edit.status == 'featured':
        pos, created = models.Position.objects.get_or_create(edit=edit,
                                         user=request.user, section='featured')
        qs = models.Position.objects.filter(section='featured')
    else:
        pos, created = models.Position.objects.get_or_create(edit=edit,
                                         user=request.user, section='personal')
        qs = models.Position.objects.filter(user=request.user, section='personal')
    pos.position = qs.aggregate(Max('position'))['position__max'] + 1
    pos.save()
    response = json_response(status=200, text='created')
    response['data'] = edit.json(user=request.user)
    return render_to_json_response(response)
actions.register(addEdit, cache=False)

@login_required_json
def editEdit(request):
    '''
        takes {
            id
        }
        returns {
            ...
        }
    '''
    data = json.loads(request.POST['data'])
    edit = get_edit_or_404_json(data['id'])
    response = json_response()
    if edit.editable(request.user):
        edit.edit(data, request.user)
        response['data'] = edit.json(keys=[
            'description', 'editable', 'rightslevel',
            'id', 'name', 'posterFrames', 'status',
            'subscribed', 'user'
        ], user=request.user)
    else:
        response = json_response(status=403, text='not allowed')
    return render_to_json_response(response)
actions.register(editEdit, cache=False)

@login_required_json
def removeEdit(request):
    '''
        takes {
            ...
        }
        returns {
            ...
        }
    '''
    data = json.loads(request.POST['data'])
    edit = get_edit_or_404_json(data['id'])
    response = json_response()
    if edit.editable(request.user):
        edit.delete()
    else:
        response = json_response(status=403, text='not allowed')
    return render_to_json_response(response)
actions.register(removeEdit, cache=False)

def _order_query(qs, sort):
    order_by = []
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
            'subscribed': 'subscribed_users',
            'items': 'numberofitems'
        }.get(e['key'], e['key'])
        order = '%s%s' % (operator, key)
        order_by.append(order)
        if key == 'subscribers':
            qs = qs.annotate(subscribers=Sum('subscribed_users'))
    if order_by:
        qs = qs.order_by(*order_by)
    qs = qs.distinct()
    return qs

def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'user', 'operator':'+'}, {'key':'name', 'operator':'+'}]
    for key in ('keys', 'group', 'edit', 'range', 'position', 'positions', 'sort'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Edit.objects.find(data, user).exclude(name='')
    return query


def findEdits(request):
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
            name, user, featured, subscribed

        possible keys:
            name, user, featured, subscribed, query

        }
        returns {
            items: [object]
        }
    '''
    data = json.loads(request.POST['data'])
    query = parse_query(data, request.user)

    #order
    is_section_request = query['sort'] == [{u'operator': u'+', u'key': u'position'}]
    def is_featured_condition(x):
        return x['key'] == 'status' and \
               x['value'] == 'featured' and \
               x['operator'] in ('=', '==')
    is_featured = len(filter(is_featured_condition, data['query'].get('conditions', []))) > 0 

    if is_section_request:
        qs = query['qs']
        if not is_featured and not request.user.is_anonymous():
            qs = qs.filter(position__in=models.Position.objects.filter(user=request.user))
        qs = qs.order_by('position__position')
    else:
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
actions.register(findEdits)

@login_required_json
def subscribeToEdit(request):
    '''
        takes {
            id: string,
        }
        returns {}
    '''
    data = json.loads(request.POST['data'])
    edit = get_edit_or_404_json(data['id'])
    user = request.user
    if edit.status == 'public' and \
       edit.subscribed_users.filter(username=user.username).count() == 0:
        edit.subscribed_users.add(user)
        pos, created = models.Position.objects.get_or_create(edit=edit, user=user, section='public')
        if created:
            qs = models.Position.objects.filter(user=user, section='public')
            pos.position = qs.aggregate(Max('position'))['position__max'] + 1
            pos.save()
    response = json_response()
    return render_to_json_response(response)
actions.register(subscribeToEdit, cache=False)


@login_required_json
def unsubscribeFromEdit(request):
    '''
        takes {
            id: string,
            user: username(only admins)
        }
        returns {}
    '''
    data = json.loads(request.POST['data'])
    edit = get_edit_or_404_json(data['id'])
    user = request.user
    edit.subscribed_users.remove(user)
    models.Position.objects.filter(edit=edit, user=user, section='public').delete()
    response = json_response()
    return render_to_json_response(response)
actions.register(unsubscribeFromEdit, cache=False)


@login_required_json
def sortEdits(request):
    '''
        takes {
            section: 'personal',
            ids: [1,2,4,3]
        }
            known sections: 'personal', 'public', 'featured'
            featured can only be edited by admins

        returns {}
    '''
    data = json.loads(request.POST['data'])
    position = 0
    section = data['section']
    section = {
        'favorite': 'public'
    }.get(section,section)
    #ids = list(set(data['ids']))
    ids = data['ids']
    if section == 'featured' and not request.user.get_profile().capability('canEditFeaturedEdits'):
        response = json_response(status=403, text='not allowed')
    else:
        user = request.user
        if section == 'featured':
            for i in ids:
                l = get_edit_or_404_json(i)
                qs = models.Position.objects.filter(section=section, edit=l)
                if qs.count() > 0:
                    pos = qs[0]
                else:
                    pos = models.Position(edit=l, user=user, section=section)
                if pos.position != position:
                    pos.position = position
                    pos.save()
                position += 1
                models.Position.objects.filter(section=section, edit=l).exclude(id=pos.id).delete()
        else:
            for i in ids:
                l = get_edit_or_404_json(i)
                pos, created = models.Position.objects.get_or_create(edit=l,
                                            user=request.user, section=section)
                if pos.position != position:
                    pos.position = position
                    pos.save()
                position += 1

        response = json_response()
    return render_to_json_response(response)
actions.register(sortEdits, cache=False)

def icon(request, id, size=16):
    if not size:
        size = 16

    id = id.split(':')
    username = id[0]
    name = ":".join(id[1:])
    qs = models.Edit.objects.filter(user__username=username, name=name)
    if qs.count() == 1 and qs[0].accessible(request.user):
        edit = qs[0]
        icon = edit.get_icon(int(size))
    else:
        icon = os.path.join(settings.STATIC_ROOT, 'jpg/list256.jpg')
    return HttpFileResponse(icon, content_type='image/jpeg')
