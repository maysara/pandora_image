# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

import models
from ox.utils import json
from ox.django.shortcuts import render_to_json_response, json_response

from itemlist.views import get_list_or_404_json
from ox.django.api import actions

def tv(request):
    '''
        takes {
            list: string
        }
        returns {
            item: string,
            position: float,
            title: string,
            ...
        }
    '''
    data = json.loads(request.POST['data'])
    if 'list' in data and data['list']:
        list = get_list_or_404_json(data['list'])
        if list.accessible(request.user):
            channel, created = models.Channel.objects.get_or_create(list=list)
            response = json_response(status=200, text='created')
            response['data'] = channel.json(request.user)
        else:
            response = json_response(status=404, text='list not found')
    else:
        channel, created = models.Channel.objects.get_or_create(list=None)
        response = json_response(status=200, text='ok')
        response['data'] = channel.json(request.user)
    return render_to_json_response(response)
actions.register(tv, cache=False)
