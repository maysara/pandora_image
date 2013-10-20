# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.conf import settings
from django.utils.http import same_origin
from django.core.exceptions import ImproperlyConfigured
from django.contrib.auth.models import User
from django.contrib import auth
try:
    from django.utils.encoding import smart_bytes
except ImportError:
    from django.utils.encoding import smart_str as smart_bytes

from ox.django.shortcuts import json_response
from ox.utils import json
import requests

import models


def signin(request):
    data = json.loads(request.POST['data'])
    response = json_response({
        'errors': {
            'email': 'Failed to verify email'
        }
    })
    verification_data = verify(request, data['assertion'])
    if verification_data:
        email = verification_data['email']
        username = data.get('username')
        qs = User.objects.filter(email__iexact=email)
        if qs.count() == 0:
            if not username:
                response = json_response({
                    'errors': {
                        'username': 'New user, please provide username'
                    }
                })
                return response
            user = User()
            user.email = email
            user.username = username
            user.save()
        else:
            user = qs[0]
        if user.is_active:
            request.session['ui'] = '{}'
            #fixme. use custom backend instead?
            user.backend = 'django.contrib.auth.backends.ModelBackend'
            auth.login(request, user)
            user_json = models.init_user(user, request)
            response = json_response({
                'user': user_json
            })
        else:
            response = json_response({
                'errors': {
                    'email': 'User Disabled'
                }
            })
    return response

def get_audience(request):
    try:
        audiences = settings.BROWSERID_AUDIENCES
    except AttributeError:
        raise ImproperlyConfigured('Required setting BROWSERID_AUDIENCES not found!')

    protocol = 'https' if request.is_secure() else 'http'
    host = '%s://%s' % (protocol, request.get_host())
    for audience in audiences:
        if same_origin(host, audience):
            return audience

    raise ImproperlyConfigured('No audience could be found in BROWSERID_AUDIENCES for host `{0}`.'
                               .format(host))

def verify(request, assertion):
    audience = get_audience(request)
    data = {'assertion': assertion, 'audience': audience}
    resp = requests.post('https://verifier.login.persona.org/verify', data=data, verify=True)
    if resp.ok:
        verification_data = json.loads(resp.content)
        if verification_data['status'] == 'okay':
            return verification_data
    return None

