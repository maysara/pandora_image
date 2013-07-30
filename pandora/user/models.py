# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import copy
from datetime import datetime

from django.contrib.auth.models import User
from django.db import models
from django.db.models import Max
from django.conf import settings
from django.contrib.gis.utils import GeoIP

import ox
from ox.django.fields import DictField
from ox.utils import json

from itemlist.models import List, Position
import text
import edit

import managers
import tasks

class SessionData(models.Model):
    session_key = models.CharField(max_length=40, primary_key=True)
    user = models.ForeignKey(User, unique=True, null=True, blank=True, related_name='data')
    firstseen = models.DateTimeField(auto_now_add=True, db_index=True)
    lastseen = models.DateTimeField(default=datetime.now, db_index=True)
    username = models.CharField(max_length=255, null=True, db_index=True)
    level = models.IntegerField(default=0, db_index=True)

    timesseen = models.IntegerField(default=0)
    ip = models.CharField(max_length=255, null=True)
    useragent = models.CharField(max_length=255, null=True)
    windowsize = models.CharField(max_length=255, null=True)
    screensize = models.CharField(max_length=255, null=True)
    info = DictField(default={})

    location = models.CharField(max_length=255, null=True)
    location_sort = models.CharField(max_length=255, null=True)
    system = models.CharField(max_length=255, null=True)
    browser = models.CharField(max_length=255, null=True)

    numberoflists = models.IntegerField(default=0, null=True)

    objects = managers.SessionDataManager()

    groupssort = models.CharField(default=None,blank=True,null=True, max_length=255)

    def __unicode__(self):
        return u"%s" % self.session_key

    def parse_useragent(self):
        if self.useragent:
            ua = ox.parse_useragent(self.useragent)
            self.browser = ua['browser']['string'].lower()
            self.system = ua['system']['string'].lower()
            if not self.browser:
                self.browser = None
            if not self.system:
                self.system = None
            if ua['robot']['name']:
                self.level = -1

    def parse_data(self):
        self.parse_useragent()
        if self.ip:
            try:
                g = GeoIP()
                location = g.city(self.ip)
                if location:
                    country = ox.get_country_name(location['country_code'])
                    if location['city']:
                        city = location['city']
                        if type(city) != unicode:
                            city = city.decode('latin-1')
                        self.location = u'%s, %s' % (city, country)
                        self.location_sort = u'%s, %s' % (country, city)
                    else:
                        self.location_sort = self.location = country
                else:
                    self.location_sort = self.location = None
            except:
                self.location_sort = self.location = None
                pass

    def save(self, *args, **kwargs):
        if self.user:
            self.username = self.user.username
            self.level = self.user.get_profile().level
            self.firstseen = self.user.date_joined
            self.groupssort = ''.join([g.name for g in self.user.groups.all()])
            self.numberoflists = self.user.lists.count()
        else:
            self.groupssort = None
        super(SessionData, self).save(*args, **kwargs)

    @classmethod
    def get_or_create(cls, request):
        if not request.session.session_key:
            request.session.save()
            request.session.modified = True
        session_key = request.session.session_key
        assert session_key
        if request.user.is_authenticated():
            cls.objects.filter(user=request.user).update(session_key=session_key)
        data, created = cls.objects.get_or_create(session_key=session_key)
        if request.user.is_authenticated():
            data.user = request.user
        data.ip = request.META['REMOTE_ADDR']
        if data.ip.startswith('::ffff:'):
            data.ip = data.ip[len('::ffff:'):]
        data.useragent = request.META['HTTP_USER_AGENT']
        data.info = json.loads(request.POST.get('data', '{}'))
        screen = data.info.get('screen', {})
        if screen and 'height' in screen and 'width' in screen:
            data.screensize = u'%s\xd7%s' % (screen['width'], screen['height'])
        window = data.info.get('window', {})
        if window and 'outerHeight' in window and 'outerWidth' in window:
            data.windowsize = u'%s\xd7%s' % (window['outerWidth'], window['outerHeight'])
        if not data.timesseen:
            data.timesseen = 0
        data.timesseen += 1
        data.lastseen = datetime.now()
        data.save()
        tasks.parse_data.delay(data.session_key)
        return data

    def get_id(self):
        return self.user and ox.toAZ(self.user.id) or self.session_key

    def json(self, keys=None, user=None):
        ua = ox.parse_useragent(self.useragent or '')
        j = {
            'browser': ua['browser']['string'],
            'disabled': False,
            'email': '',
            'firstseen': self.firstseen,
            'ip': self.ip,
            'id': self.get_id(),
            'lastseen': self.lastseen,
            'level': 'robot' if ua['robot']['name'] else 'guest',
            'location': self.location,
            'newsletter': False,
            'notes': '',
            'numberoflists': 0,
            'screensize': self.screensize,
            'system': ua['system']['string'],
            'timesseen': self.timesseen,
            'username': self.username or '',
            'useragent': self.useragent,
            'windowsize': self.windowsize,
        }
        if self.user:
            p = self.user.get_profile()
            j['disabled'] = not self.user.is_active
            j['email'] = self.user.email
            j['groups'] = [g.name for g in self.user.groups.all()]
            j['level'] = p.get_level()
            j['newsletter'] = p.newsletter
            j['notes'] = p.notes
            j['numberoflists'] = self.numberoflists
        if keys:
            for key in j.keys():
                if key not in keys:
                    del j[key]
        return j

class UserProfile(models.Model):
    reset_code = models.CharField(max_length=255, blank=True, null=True, unique=True)
    user = models.ForeignKey(User, unique=True, related_name='profile')

    level = models.IntegerField(default=1)
    files_updated = models.DateTimeField(default=datetime.now)
    newsletter = models.BooleanField(default=True)
    ui = DictField(default={})
    preferences = DictField(default={})

    notes = models.TextField(default='')

    def __unicode__(self):
        return self.user.username

    def get_ui(self):
        return get_ui(self.ui, self.user)

    def set_level(self, level):
        self.level = settings.CONFIG['userLevels'].index(level)
        if self.level == len(settings.CONFIG['userLevels']) - 1:
            if not self.user.is_superuser:
                self.user.is_superuser = True
                self.user.save()
        elif self.user.is_superuser:
            self.user.is_superuser = False
            self.user.save()

    def get_level(self):
        #django superuser should always be admin
        if self.user.is_superuser:
            if self.level != len(settings.CONFIG['userLevels']) - 1:
                self.level = len(settings.CONFIG['userLevels']) - 1
                self.save()
        return settings.CONFIG['userLevels'][self.level]

    def capability(self, capability):
        return settings.CONFIG['capabilities'][capability].get(self.get_level()) == True

def user_post_save(sender, instance, **kwargs):
    profile, new = UserProfile.objects.get_or_create(user=instance)
    if new and instance.is_superuser:
        profile.level = len(settings.CONFIG['userLevels']) - 1
        profile.newsletter = True
        profile.save()
    SessionData.objects.filter(user=instance).update(level=profile.level,
                                                     username=instance.username)
models.signals.post_save.connect(user_post_save, sender=User)

def profile_post_save(sender, instance, **kwargs):
    SessionData.objects.filter(user=instance.user).update(level=instance.level,
                                                     username=instance.user.username)
models.signals.post_save.connect(profile_post_save, sender=UserProfile)

def get_ui(user_ui, user=None):
    ui = {}
    config = copy.deepcopy(settings.CONFIG)
    ui.update(config['user']['ui'])
    def update_ui(ui, new):
        '''
            only update set keys in dicts
        '''
        for key in new:
            if isinstance(new[key], dict) and key in ui:
                ui[key] = update_ui(ui[key], new[key])
            elif isinstance(ui, dict):
                ui[key] = new[key]
        return ui
    ui = update_ui(ui, user_ui)
    if not 'lists' in ui:
        ui['lists'] = {}

    def add(lists, section):
        ids = []
        for l in lists:
            qs = Position.objects.filter(section=section)
            if section == 'featured':
                try:
                    pos = Position.objects.get(list=l, section=section)
                    created = False
                except Position.DoesNotExist:
                    pos = Position(list=l, section=section, user=l.user)
                    pos.save()
                    created = True 
            else:
                pos, created = Position.objects.get_or_create(list=l, user=user, section=section)
                qs = qs.filter(user=user)
            if created:
                pos.position = qs.aggregate(Max('position'))['position__max'] + 1
                pos.save()
            id = l.get_id()
            '''
            if id not in ui['lists']:
                ui['lists'][id] = {}
                ui['lists'][id].update(ui['lists'][''])
            '''
            ids.append(id)
        return ids
    
    def add_texts(texts, section):
        P = text.models.Position
        ids = []
        for t in texts:
            qs = P.objects.filter(section=section)
            if section == 'featured':
                try:
                    pos = P.objects.get(text=t, section=section)
                    created = False
                except P.DoesNotExist:
                    pos = P(text=t, section=section, user=t.user)
                    pos.save()
                    created = True 
            else:
                pos, created = P.objects.get_or_create(text=t, user=user, section=section)
                qs = qs.filter(user=user)
            if created:
                pos.position = qs.aggregate(Max('position'))['position__max'] + 1
                pos.save()
            ids.append(t.get_id())
        return ids

    def add_edits(edits, section):
        P = edit.models.Position
        ids = []
        for t in edits:
            qs = P.objects.filter(section=section)
            if section == 'featured':
                try:
                    pos = P.objects.get(edit=t, section=section)
                    created = False
                except P.DoesNotExist:
                    pos = P(edit=t, section=section, user=t.user)
                    pos.save()
                    created = True 
            else:
                pos, created = P.objects.get_or_create(edit=t, user=user, section=section)
                qs = qs.filter(user=user)
            if created:
                pos.position = qs.aggregate(Max('position'))['position__max'] + 1
                pos.save()
            ids.append(t.get_id())
        return ids

    ids = ['']
    if user:
        ids += add(user.lists.exclude(status="featured"), 'personal')
        ids += add(user.subscribed_lists.filter(status='public'), 'public')
    ids += add(List.objects.filter(status='featured'), 'featured')
    for i in ui['lists'].keys():
        if i not in ids:
            del ui['lists'][i]
    tids = ['']
    if user:
        tids += add_texts(user.texts.exclude(status="featured"), 'personal')
        tids += add_texts(user.subscribed_texts.filter(status='public'), 'public')
    tids += add_texts(text.models.Text.objects.filter(status='featured'), 'featured')
    if user:
        tids += add_edits(user.edits.exclude(status="featured"), 'personal')
        tids += add_edits(user.subscribed_edits.filter(status='public'), 'public')
    tids += add_edits(edit.models.Edit.objects.filter(status='featured'), 'featured')
    return ui

def init_user(user, request=None):
    if request:
        SessionData.get_or_create(request)
    if user.is_anonymous():
        result = settings.CONFIG['user'].copy()
        result['ui'] = get_ui(json.loads(request.session.get('ui', '{}')))
    else:
        profile = user.get_profile()
        result = {}
        for key in ('username', ):
            result[key] = getattr(user, key)
        result['level'] = profile.get_level()
        result['groups'] = [g.name for g in user.groups.all()]
        result['email'] = user.email
        result['newsletter'] = profile.newsletter
        result['ui'] = profile.get_ui()
        result['volumes'] = [v.json() for v in user.volumes.all()] 
    return result

def user_json(user, keys=None):
    p = user.get_profile()
    j = {
        'disabled': not user.is_active,
        'email': user.email,
        'firstseen': user.date_joined,
        'id': ox.toAZ(user.id),
        'lastseen': user.last_login,
        'level': p.get_level(),
        'newsletter': p.newsletter,
        'notes': p.notes,
        'numberoflists': user.lists.count(),
        'username': user.username,
    }
    if keys:
        for key in j.keys():
            if key not in keys:
                del j[key]
    return j

def has_capability(user, capability):
    if user.is_anonymous():
        level = 'guest'
    else:
        level = user.get_profile().get_level()
    return level in settings.CONFIG['capabilities'][capability] \
            and settings.CONFIG['capabilities'][capability][level]
