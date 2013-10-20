# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division
import os.path
from datetime import datetime

from django import forms
from django.shortcuts import get_object_or_404, redirect
from django.conf import settings
from django.db.models import Count

import ox
from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response
from ox.django.views import task_status

from item import utils
from item.models import get_item, Item
from item.views import parse_query
import item.tasks
from ox.django.api import actions

import models
import tasks


@login_required_json
def removeVolume(request):
    data = json.loads(request.POST['data'])
    user = request.user
    try:
        volume = models.Volume.objects.get(user=user, name=data['volume'])
        volume.files.delete()
        volume.delete()
        response = json_response()
    except models.Volume.DoesNotExist:
        response = json_response(status=404, text='volume not found')
    return render_to_json_response(response)
actions.register(removeVolume, cache=False)


@login_required_json
def update(request):
    '''
        2 steps:
            send files
                {volume: 'Videos', files: [{oshash:, path:, mtime:, ,,}]}
            send info about changed/new files
                {volume: 'Videos', info: {oshash: {...}]}

        call volume/files first and fill in requested info after that

        takes {
            volume: '',
            files: [
                {oshash:, path:, mtime:, },
                ...
            ],
            info: {oshash: object}
        }

        returns {
            info: list, // list of files that need info
            data: list, // list of flies that should be encoded to highest profile and uploaded
            file: list  // list of files that should be uploaded as is
        }
    '''
    data = json.loads(request.POST['data'])
    user = request.user
    upload_only = data.get('upload', False)

    response = json_response({'info': [], 'data': [], 'file': []})
    volume = None
    if 'files' in data:
        t = tasks.update_files.delay(user.username, data['volume'], data['files'])
        response['data']['taskId'] = t.task_id

        user_profile = user.get_profile()
        user_profile.files_updated = datetime.now()
        user_profile.save()

    if 'info' in data:
        files = models.File.objects.filter(oshash__in=data['info'].keys())
        for f in files:
            if not f.info:
                f.update_info(data['info'][f.oshash], user)
                f.save()
        for i in Item.objects.filter(files__in=files).distinct():
            i.update_selected()
            i.update_wanted()
    if not upload_only:
        all_files = models.Instance.objects.filter(volume__user=user)
        files = all_files.filter(file__available=False)
        if volume:
            files = files.filter(volume=volume)
        response['data']['info'] = [f.file.oshash for f in all_files.filter(file__info='{}')]
        response['data']['data'] = [f.file.oshash for f in files.filter(file__is_video=True,
                                                                        file__available=False,
                                                                        file__wanted=True)]
        response['data']['data'] += [f.file.oshash for f in files.filter(file__is_audio=True,
                                                                         file__available=False,
                                                                         file__wanted=True)]

        if filter(lambda l: l['id'] == 'subtitles', settings.CONFIG['layers']):
            response['data']['file'] = [f.file.oshash
                                        for f in files.filter(file__is_subtitle=True,
                                                              file__available=False,
                                                              path__endswith='.srt')]
        else:
            response['data']['file'] = []
    return render_to_json_response(response)
actions.register(update, cache=False)


@login_required_json
def upload(request):
    '''
        takes {
            id: string
            frame: [] //multipart frames
            file: [] //multipart file
        }

        returns {
            info: object,
            rename: object
        }
    '''
    response = json_response({})
    f = get_object_or_404_json(models.File, oshash=request.POST['id'])
    if 'frame' in request.FILES:
        if f.editable(request.user):
            f.frames.all().delete()
            for frame in request.FILES.getlist('frame'):
                name = frame.name
                #float required?
                position = float(os.path.splitext(name)[0])
                fr, created = models.Frame.objects.get_or_create(file=f, position=position)
                if fr.frame:
                    fr.frame.delete()
                fr.frame.save(name, frame)
                os.chmod(fr.frame.path, 0644)
            f.item.select_frame()
            f.item.save()
            item.tasks.update_poster.delay(f.item.itemId)
    if 'file' in request.FILES:
        if not f.available:
            if f.data:
                f.data.delete()
            f.data.save('data.raw', request.FILES['file'])
            f.save()
            os.chmod(f.data.path, 0644)
            item.tasks.load_subtitles.delay(f.item.itemId)
            response = json_response(text='file saved')
        else:
            response = json_response(status=403, text='permissino denied')
    return render_to_json_response(response)
actions.register(upload, cache=False)


class ChunkForm(forms.Form):
    chunk = forms.FileField()
    chunkId = forms.IntegerField(required=False)
    done = forms.IntegerField(required=False)

@login_required_json
def addMedia(request):
    '''
        takes {
            id: oshash
            filename: string,
            item: string
            info: {}
        }
        returns {
            item: id,
        }
    '''
    response = json_response({})
    data = json.loads(request.POST['data'])
    oshash = data.pop('id')
    if not request.user.get_profile().capability('canAddItems'):
        response = json_response(status=403, text='permissino denied')
    elif models.File.objects.filter(oshash=oshash).count() > 0:
        f = models.File.objects.get(oshash=oshash)
        if f.available:
            response['status']['text'] = 'file exists'
        response['data']['item'] = f.item.itemId
        response['data']['itemUrl'] = request.build_absolute_uri('/%s' % f.item.itemId)
    else:
        if 'item' in data:
            i = Item.objects.get(itemId=data['item'])
        else:
            title = ox.parse_movie_path(os.path.splitext(data['filename'])[0])['title']
            i = Item()
            i.data = {
                'title': title,
                'director': data.get('director', []),
            }
            i.user = request.user
            i.save()
            i.make_poster(True)
        f = models.File(oshash=oshash, item=i)
        f.path = data.get('filename', 'Untitled')
        extension = f.path.split('.')
        if len(extension) > 1:
            extension = extension[-1]
        else:
            extension = 'webm'
        f.selected = True
        if 'info' in data and data['info']:
            f.info = data['info']
        f.info['extension'] = extension
        f.parse_info()
        f.save()
        response['data']['item'] = i.itemId
        response['data']['itemUrl'] = request.build_absolute_uri('/%s' % i.itemId)
    return render_to_json_response(response)
actions.register(addMedia, cache=False)

@login_required_json
def firefogg_upload(request):
    profile = request.GET['profile']
    oshash = request.GET['id']
    config = settings.CONFIG['video']
    video_profile = "%sp.%s" % (max(config['resolutions']), config['formats'][0])

    #handle video upload
    if request.method == 'POST':
        #post next chunk
        if 'chunk' in request.FILES and oshash:
            f = get_object_or_404(models.File, oshash=oshash)
            form = ChunkForm(request.POST, request.FILES)
            if form.is_valid() and profile == video_profile and f.editable(request.user):
                c = form.cleaned_data['chunk']
                chunk_id = form.cleaned_data['chunkId']
                response = {
                    'result': 1,
                    'resultUrl': request.build_absolute_uri('/%s'%f.item.itemId)
                }
                if not f.save_chunk_stream(c, chunk_id, form.cleaned_data['done']):
                    response['result'] = -1
                elif form.cleaned_data['done']:
                    f.uploading = False
                    f.queued = True
                    f.save()
                    #FIXME: this fails badly if rabbitmq goes down
                    try:
                        t = tasks.process_stream.delay(f.id)
                        response['resultUrl'] = t.task_id
                    except:
                        pass
                    response['result'] = 1
                    response['done'] = 1
                return render_to_json_response(response)
        #init upload
        elif oshash and profile == video_profile:
            #404 if oshash is not know, files must be registered via update api first
            f = get_object_or_404(models.File, oshash=oshash)
            if f.editable(request.user):
                f.streams.all().delete()
                f.delete_frames()
                f.uploading = True
                f.save()
                if f.item.rendered and f.selected:
                    Item.objects.filter(id=f.item.id).update(rendered=False)
                response = {
                    'uploadUrl': request.build_absolute_uri('/api/upload/?id=%s&profile=%s' % (f.oshash, profile)),
                    'url': request.build_absolute_uri('/%s' % f.item.itemId),
                    'result': 1
                }
                return render_to_json_response(response)
            else:
                response = json_response(status=404, text='permission denied')
    response = json_response(status=400, text='this request requires POST')
    return render_to_json_response(response)

@login_required_json
def direct_upload(request):
    if 'id' in request.GET:
        file = models.File.objects.get(oshash=request.GET['id'])
    else:
        oshash = request.POST['id']
    response = json_response(status=400, text='this request requires POST')
    if 'chunk' in request.FILES:
        form = ChunkForm(request.POST, request.FILES)
        if form.is_valid() and file.editable(request.user):
            c = form.cleaned_data['chunk']
            chunk_id = form.cleaned_data['chunkId']
            response = {
                'result': 1,
                'resultUrl': request.build_absolute_uri(file.item.get_absolute_url())
            }
            if not file.save_chunk(c, chunk_id, form.cleaned_data['done']):
                response['result'] = -1
            if form.cleaned_data['done']:
                file.uploading = False
                file.queued = True
                file.save()
                #try/execpt so it does not fail if rabitmq is down
                try:
                    t = tasks.extract_stream.delay(file.id)
                    response['resultUrl'] = t.task_id
                except:
                    pass
                response['done'] = 1
            return render_to_json_response(response)
    #init upload
    else:
        file, created = models.File.objects.get_or_create(oshash=oshash)
        if file.editable(request.user):
            #remove previous uploads
            if not created:
                file.streams.all().delete()
                file.delete_frames()
                if file.item.rendered and file.selected:
                    Item.objects.filter(id=file.item.id).update(rendered=False)
            file.uploading = True
            file.save()
            upload_url = request.build_absolute_uri('/api/upload/direct/?id=%s' % file.oshash)
            return render_to_json_response({
                'uploadUrl': upload_url,
                'url': request.build_absolute_uri(file.item.get_absolute_url()),
                'result': 1
            })
        else:
            response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)


@login_required_json
def taskStatus(request):
    #FIXME: should check if user has permissions to get status
    data = json.loads(request.POST['data'])
    if 'taskId' in data:
        task_id = data['taskId']
    else:
        task_id = data['task_id']
    response = task_status(request, task_id)
    return render_to_json_response(response)
actions.register(taskStatus, cache=False)


@login_required_json
def moveMedia(request):
    '''
        change file / item link
        takes {
            ids: ids of files
            item: new itemId
        }

        returns {
        }
    '''
    data = json.loads(request.POST['data'])
    if Item.objects.filter(itemId=data['item']).count() == 1:
        i = Item.objects.get(itemId=data['item'])
    else:
        data['itemId'] = data.pop('item').strip()
        if len(data['itemId']) != 7:
            del data['itemId']
            if 'director' in data and isinstance(data['director'], basestring):
                if data['director'] == '':
                    data['director'] = []
                else:
                    data['director'] = data['director'].split(', ')
            i = get_item(data, user=request.user)
        else:
            i = get_item({'imdbId': data['itemId']}, user=request.user)
    changed = [i.itemId]
    for f in models.File.objects.filter(oshash__in=data['ids']):
        if f.item.id != i.itemId and f.editable(request.user):
            if f.item.itemId not in changed:
                changed.append(f.item.itemId)
            f.item = i 
            f.save()
    for itemId in changed:
        c = Item.objects.get(itemId=itemId)
        if c.files.count() == 0 and settings.CONFIG['itemRequiresVideo']:
            c.delete()
        else:
            c.rendered = False
            c.save()
            item.tasks.update_timeline.delay(itemId)
    response = json_response(text='updated')
    response['data']['item'] = i.itemId
    return render_to_json_response(response)
actions.register(moveMedia, cache=False)

@login_required_json
def editMedia(request):
    '''
        change file / item link
        takes {
            files: [
                {id:, key1: value1, key2: value2}
                ...
            ]
        }
        possible keys: part, partTitle, language, ignore, extension, version, episodes

        returns {
        }
    '''
    data = json.loads(request.POST['data'])

    ignore = []
    dont_ignore = []
    response = json_response(status=200, text='updated')
    response['data']['files'] = []
    for info in data['files']:
        f = get_object_or_404_json(models.File, oshash=info['id'])
        if f.editable(request.user):
            if 'ignore' in info:
                if info['ignore']:
                    ignore.append(info['id'])
                else:
                    dont_ignore.append(info['id'])
            update = False
            for key in f.PATH_INFO:
                if key in info:
                    f.info[key] = info[key]
                    update = True
            if update:
                f.save()
            response['data']['files'].append(f.json())
        else:
            response['data']['files'].append({'id': info['id'], 'error': 'permission denied'})
    if ignore:
        models.Instance.objects.filter(file__oshash__in=ignore).update(ignore=True)
    if dont_ignore:
        models.Instance.objects.filter(file__oshash__in=dont_ignore).update(ignore=False)
    if ignore or dont_ignore:
        files = models.File.objects.filter(oshash__in=ignore+dont_ignore)
        #FIXME: is this to slow to run sync?
        for i in Item.objects.filter(files__in=files).distinct():
            i.update_selected()
            i.update_wanted()
    return render_to_json_response(response)
actions.register(editMedia, cache=False)


@login_required_json
def removeMedia(request):
    data = json.loads(request.POST['data'])
    response = json_response()
    if request.user.get_profile().get_level() == 'admin':
        qs = models.File.objects.filter(oshash__in=data['ids'], instances__id=None)
        for f in qs:
            if f.item.sort.numberoffiles:
                f.item.sort.numberoffiles -= 1
                f.item.sort.save()
        qs.delete()
    else:
        response = json_response(status=403, text='permissino denied')
    return render_to_json_response(response)
actions.register(removeMedia, cache=False)

def getPath(request):
    '''
        change file / item link
        takes {
            id: [hash of file]
        }

        returns {
            id: path
        }
    '''
    data = json.loads(request.POST['data'])
    response = json_response()
    ids = data['id']
    if isinstance(ids, basestring):
        ids = [ids]
    for f in models.File.objects.filter(oshash__in=ids).values('path', 'oshash').order_by('sort_path'):
        response['data'][f['oshash']] = f['path']
    return render_to_json_response(response)
actions.register(getPath, cache=True)

def lookup_file(request, oshash):
    oshash = oshash.replace('/', '')
    f = get_object_or_404(models.File, oshash=oshash)
    return redirect('%s/media' % f.item.get_absolute_url())


def _order_query(qs, sort, prefix=''):
    order_by = []
    if len(sort) == 1:
        sort.append({'operator': '+', 'key': 'path'})
        sort.append({'operator': '-', 'key': 'created'})

    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
            'id': 'item__itemId',
            'users': 'instances__volume__user__username',
            'resolution': 'width',
            'path': 'sort_path'
        }.get(e['key'], e['key'])
        #if operator=='-' and '%s_desc'%key in models.ItemSort.descending_fields:
        #    key = '%s_desc' % key
        order = '%s%s%s' % (operator, prefix, key)
        order_by.append(order)
        if key == 'part':
            order = '%s%s%s' % (operator, prefix, 'sort_path')
            order_by.append(order)

    if order_by:
        qs = qs.order_by(*order_by)
    return qs


def findMedia(request):
    '''
        takes {
            'query': query,
            'sort': array,
            'range': array
        }

            query: item query object, more on query syntax at
                   https://wiki.0x2620.org/wiki/pandora/QuerySyntax
                   get media for all items matching the given query

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
            keys:  array of keys to return
            group:    group elements by, country, genre, director...

        with keys, items is list of dicts with requested properties:
          returns {
              items: [object]
          }

Groups
        takes {
            'query': query,
            'key': string,
            'group': string,
            'range': array
        }

            query: query object, more on query syntax at
                   https://wiki.0x2620.org/wiki/pandora/QuerySyntax
            range:       result range, array [from, to]
            keys:  array of keys to return
            group:    group elements by, country, genre, director...

        possible values for keys: path, items

        with keys
        items contains list of {'path': string, 'items': int}:
        returns {
            items: [object]
        }

        without keys: return number of items in given query
          returns {
              items: int
          }

Positions
        takes {
            'query': query,
            'positions': [string]
        }

            query: query object, more on query syntax at
                   https://wiki.0x2620.org/wiki/pandora/QuerySyntax
            positions:  ids of items for which positions are required
        returns {
            positions: {
                id: position
            }
        }
    '''
    data = json.loads(request.POST['data'])
    if not data.get('sort'):
        data['sort'] = [{'key': 'path', 'operator': '+'}]
    query = parse_query(data, request.user)

    response = json_response({})
    if 'group' in query:
        if 'sort' in query:
            if len(query['sort']) == 1 and query['sort'][0]['key'] == 'items':
                if query['group'] == "year":
                    order_by = query['sort'][0]['operator'] == '-' and 'items' or '-items'
                else:
                    order_by = query['sort'][0]['operator'] == '-' and '-items' or 'items'
                if query['group'] != "keyword":
                    order_by = (order_by, 'sortvalue')
                else:
                    order_by = (order_by,)
            else:
                order_by = query['sort'][0]['operator'] == '-' and '-sortvalue' or 'sortvalue'
                order_by = (order_by, 'items')
        else:
            order_by = ('-sortvalue', 'items')
        response['data']['items'] = []
        items = 'items'
        item_qs = query['qs']
        qs = models.Facet.objects.filter(key=query['group']).filter(item__id__in=item_qs)
        qs = qs.values('value').annotate(items=Count('id')).order_by(*order_by)

        if 'positions' in query:
            #FIXME: this does not scale for larger results
            response['data']['positions'] = {}
            ids = [j['value'] for j in qs]
            response['data']['positions'] = utils.get_positions(ids, query['positions'])

        elif 'range' in data:
            qs = qs[query['range'][0]:query['range'][1]]
            response['data']['items'] = [{'path': i['value'], 'items': i[items]} for i in qs]
        else:
            response['data']['items'] = qs.count()
    elif 'positions' in query:
        #FIXME: this does not scale for larger results
        qs = models.File.objects.filter(item__in=query['qs'])
        qs = _order_query(qs, query['sort'])

        response['data']['positions'] = {}
        ids = [j['oshash'] for j in qs.values('oshash')]
        response['data']['positions'] = utils.get_positions(ids, query['positions'])

    elif 'keys' in query:
        response['data']['items'] = []
        qs = models.File.objects.filter(item__in=query['qs'])
        qs = _order_query(qs, query['sort'])
        qs = qs.select_related()
        keys = query['keys']
        qs = qs[query['range'][0]:query['range'][1]]
        response['data']['items'] = [f.json(keys) for f in qs]
    else: # otherwise stats
        items = query['qs']
        files = models.File.objects.filter(item__in=query['qs'])
        response['data']['items'] = files.count()
    return render_to_json_response(response)

actions.register(findMedia)

def parsePath(request): #parse path and return info
    '''
        takes {
            path: string
        }
        returns {
            imdb: string
        }
    '''
    path = json.loads(request.POST['data'])['path']
    response = json_response(ox.parse_movie_path(path))
    return render_to_json_response(response)
actions.register(parsePath)

def getMediaInfo(request):
    '''
        takes {
            id: oshash of stream file
        }
        returns {
            item: itemId,
            file: oshash of source file
        }
    '''
    data = json.loads(request.POST['data'])
    f = None
    qs = models.Stream.objects.filter(oshash=data['id'])
    if qs.count() > 0:
        s = qs[0]
        f = s.file
    else:
        qs = models.File.objects.filter(oshash=data['id'])
        if qs.count() > 0:
            f = qs[0]
    response = json_response()
    if f:
        response['data'] = {
            'file': f.oshash,
            'item': f.item.itemId
        }
    return render_to_json_response(response)
actions.register(getMediaInfo)

