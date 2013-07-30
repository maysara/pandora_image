# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

import os
import sys
import shutil
import time
import thread
from glob import glob

from django.conf import settings
from django.contrib.auth.models import User

import ox.jsonc
from ox.utils import json

from archive.extract import supported_formats, AVCONV
from item.utils import get_by_id


_win = (sys.platform == "win32")

RUN_RELOADER = True
NOTIFIER = None

def get_version():
    info = os.path.join(os.path.dirname(__file__), '..', '..', '.bzr/branch/last-revision')
    if os.path.exists(info):
        f = open(info)
        rev = int(f.read().split()[0])
        f.close()
        if rev:
            return u'%s' % rev
    return u'unknown'

def load_config():
    with open(settings.SITE_CONFIG) as f:
        try:
            config = ox.jsonc.load(f)
        except:
            config = None

    with open(settings.DEFAULT_CONFIG) as f:
        try:
            default = ox.jsonc.load(f)
        except:
            default = None

    if config:
        settings.SITENAME = config['site']['name']
        if getattr(settings, 'SITEURL', False):
            config['site']['url'] = settings.SITEURL
        settings.URL = config['site']['url']
        settings.EMAIL_SUBJECT_PREFIX = '[%s]'%settings.SITENAME
        settings.DEFAULT_FROM_EMAIL = config['site']['email']['system']
        settings.SERVER_EMAIL = config['site']['email']['system']
        config['site']['videoprefix'] = settings.VIDEO_PREFIX
        config['site']['version'] = get_version()
        if not 'folderdepth' in config['site']:
            config['site']['folderdepth'] = settings.USE_IMDB and 4 or 3

        config['keys'] = {}
        for key in config['itemKeys']:
            config['keys'][key['id']] = key


        #add missing defaults
        for section in (
            'capabilities', 'cantPlay', 'itemName', 'media', 'posters',
            'site', 'tv', 'user.ui', 'user.ui.part', 'user.ui.showFolder'
        ):
            parts = map(lambda p: p.replace('\0', '\\.'), section.replace('\\.', '\0').split('.'))
            #print 'checking', section
            c = config
            d = default
            while len(parts):
                part = parts.pop(0)
                if part not in c:
                    c[part] = {}
                c = c[part]
                d = d[part]
            for key in d:
                if key not in c:
                    sys.stderr.write("adding default value for %s.%s = %s\n" % (
                        section, key, str(d[key])))
                    c[key] = d[key]

        key = get_by_id(config['itemKeys'], 'title')
        if not 'autocompleteSort' in key:
            key['autocompleteSort'] = get_by_id(default['itemKeys'], 'title')['autocompleteSort']
            sys.stderr.write("adding default value for itemKeys.title.autocompleteSort = %r\n" % key['autocompleteSort'])

        old_formats = getattr(settings, 'CONFIG', {}).get('video', {}).get('formats', [])
        formats = config.get('video', {}).get('formats')
        if set(old_formats) != set(formats):
            sformats = supported_formats()
            if sformats:
                for f in formats:
                    if f not in sformats or not sformats[f]:
                        sys.stderr.write('''WARNING:
Your configuration contains a video format "%s" that is
not supported by your version of avconv. Make sure you
dont have a local version of avconv in /usr/local/bin
and libavcodec-extra-53 and libav-tools are installed:

    sudo apt-get install libavcodec-extra-53 libav-tools

''' % f)
            else:
                sys.stderr.write('''WARNING:
You dont have "%s" installed.
To fix this on Ubuntu 12.04, run:

    sudo apt-get install libavcodec-extra-53 libav-tools

check the README for further details.

''' % AVCONV)
        settings.CONFIG = config
        admin = len(settings.CONFIG['userLevels']) - 1
        if not 'syncdb' in sys.argv \
            and not 'sqldiff' in sys.argv \
            and not 'migrate' in sys.argv:
            try:
                if User.objects.filter(profile__level=admin).count() == 0:
                    for u in User.objects.filter(is_superuser=True):
                        p = u.get_profile()
                        p.level = admin
                        p.save()
                settings.ADMIN = tuple([(u.username, u.email)
                                  for u in User.objects.filter(profile__level=admin)])
                settings.MANAGERS = settings.ADMINS
            except:
                pass



def reloader_thread():
    global NOTIFIER
    settings.RELOADER_RUNNING=True
    _config_mtime = 0
    try:
        import pyinotify
        INOTIFY = True
    except:
        INOTIFY = False
    if INOTIFY:
        def add_watch():
            name = os.path.realpath(settings.SITE_CONFIG)
            wm.add_watch(name, pyinotify.IN_CLOSE_WRITE, reload_config)

        def reload_config(event):
            load_config()
            add_watch()

        wm = pyinotify.WatchManager()
        add_watch()
        notifier = pyinotify.Notifier(wm)
        NOTIFIER = notifier
        notifier.loop()
    else:
        while RUN_RELOADER:
            try:
                stat = os.stat(settings.SITE_CONFIG)
                mtime = stat.st_mtime
                if _win:
                    mtime -= stat.st_ctime
                if mtime > _config_mtime:
                    load_config()
                    _config_mtime = mtime
                time.sleep(10)
            except:
                #sys.stderr.write("reloading config failed\n")
                pass

def update_static():
    oxjs_build = os.path.join(settings.STATIC_ROOT, 'oxjs/tools/build/build.py')
    if os.path.exists(oxjs_build):
        print 'update oxjs'
        if os.path.exists(os.path.join(settings.STATIC_ROOT, 'oxjs/build/Ox.Geo/json/Ox.Geo.json')):
            geo = '-nogeo'
        else:
            geo = ''
        os.system('%s %s >/dev/null' % (oxjs_build, geo))

    data = ''
    js = []
    pandora_js = os.path.join(settings.STATIC_ROOT, 'js/pandora.min.js')
    pandora_json = os.path.join(settings.STATIC_ROOT, 'json/pandora.json')
    for root, folders, files in os.walk(os.path.join(settings.STATIC_ROOT, 'js')):
        for f in files:
            if not f in (
                'pandora.js', 'pandora.min.js'
            ) and f.endswith('.js') and len(f.split('.'))  == 2:
                f = os.path.join(root, f)
                #ignore old embed js file
                if 'js/embed/' in f:
                    continue
                fsite = f.replace('.js', '.%s.js' % settings.CONFIG['site']['id'])
                if os.path.exists(fsite):
                    f = fsite
                js.append(f[len(settings.STATIC_ROOT)+1:])
                with open(f) as j:
                    data += j.read() + '\n'
    js += [
        'png/icon.png',
    ]
    print 'write', pandora_js
    with open(pandora_js, 'w') as f:
        data = ox.js.minify(data)
        f.write(data)

    print 'write', pandora_json
    with open(pandora_json, 'w') as f:
        json.dump(sorted(js), f, indent=2)

    for f in (pandora_js, pandora_json):
        os.system('gzip -9 -c "%s" > "%s.gz"' % (f, f))

    for root, folders, files in os.walk(os.path.join(settings.STATIC_ROOT, 'oxjs/build')):
            for f in files:
                if os.path.splitext(f)[-1] in ('.js', '.json'):
                    f = os.path.join(root, f)
                    os.system('gzip -9 -c "%s" > "%s.gz"' % (f, f))
    
    for name in ('logo', 'icon'):
        site = os.path.join(settings.STATIC_ROOT, 'png/%s.%s.png'%(name, settings.CONFIG['site']['id']))
        pandora = os.path.join(settings.STATIC_ROOT, 'png/%s.pandora.png'%name)
        image = os.path.join(settings.STATIC_ROOT, 'png/%s.png'%name)
        if not os.path.exists(image):
            if os.path.exists(site):
                shutil.copyfile(site, image)
            else:
                shutil.copyfile(pandora, image)
    #locale
    for f in sorted(glob(os.path.join(settings.STATIC_ROOT, 'json/locale.pandora.*.json'))):
        with open(f) as fd:
            locale = json.load(fd)
        site_locale = f.replace('locale.pandora', 'locale.' + settings.CONFIG['site']['id'])
        locale_file = f.replace('locale.pandora', 'locale')
        print 'write', locale_file
        print '    adding', f
        if os.path.exists(site_locale):
            with open(site_locale) as fdl:
                print '    adding', site_locale
                locale.update(json.load(fdl))
        with open(locale_file, 'w') as fd:
            json.dump(locale, fd)
        os.system('gzip -9 -c "%s" > "%s.gz"' % (locale_file, locale_file))


    #download geo data
    update_geoip()

    #scripts
    for script in (settings.ITEM_POSTER, settings.ITEM_ICON, settings.LIST_ICON):
        if not os.path.exists(script):
            site_script = script.replace('.py', '.%s.py' % settings.CONFIG['site']['id'])
            default_script = script.replace('.py', '.pandora.py')
            if os.path.exists(site_script):
                os.symlink(site_script, script)
            else:
                os.symlink(default_script, script)

def update_geoip(force=False):
    path = os.path.join(settings.GEOIP_PATH, 'GeoLiteCity.dat')
    if not os.path.exists(path) or force:
        url = 'http://geolite.maxmind.com/download/geoip/database/GeoLiteCity.dat.gz'
        print 'download', url
        ox.net.save_url(url, "%s.gz"%path)
        if os.path.exists(path):
            os.unlink(path)
        os.system('gunzip "%s.gz"' % path)
    path = os.path.join(settings.GEOIP_PATH, 'GeoLiteCityv6.dat')
    if not os.path.exists(path) or force:
        url = 'http://geolite.maxmind.com/download/geoip/database/GeoLiteCityv6-beta/GeoLiteCityv6.dat.gz'
        print 'download', url
        ox.net.save_url(url, "%s.gz"%path)
        if os.path.exists(path):
            os.unlink(path)
        os.system('gunzip "%s.gz"' % path)

def init():
    if not settings.RELOADER_RUNNING:
        load_config()
        if settings.RELOAD_CONFIG:
            thread.start_new_thread(reloader_thread, ())

def shutdown():
    if settings.RELOADER_RUNNING:
        RUN_RELOADER = False
        settings.RELOADER_RUNNING = False
        if NOTIFIER:
            NOTIFIER.stop()



