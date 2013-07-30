# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

import ox
from django.conf import settings

_DATA_SERVICE=None
def external_data(action, data):
    global _DATA_SERVICE
    try:
        if not _DATA_SERVICE and settings.DATA_SERVICE:
            _DATA_SERVICE = ox.API(settings.DATA_SERVICE)
        return getattr(_DATA_SERVICE, action)(data)
    except:
        pass
    return {'status': {'code': 500, 'text':'not available'}, 'data': {}}
