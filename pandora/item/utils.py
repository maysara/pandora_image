# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
#
from decimal import Decimal
import re
import ox
from ox import sort_string

def safe_filename(filename):
    filename = filename.replace(': ', '_ ')
    filename = filename.replace('/', '_')
    filename = filename.replace('\\', '_')
    if filename.startswith('.'):
        filename = '_' + filename[1:]
    if filename.endswith('.'):
        filename = filename[:-1] + '_'
    return filename

def decode_id(id):
    try:
        id = ox.fromAZ(id)
    except:
        id = 0
    return id

def parse_decimal(string):
    string = string.replace(':', '/')
    if '/' not in string:
        string = '%s/1' % string
    d = string.split('/')
    return Decimal(d[0]) / Decimal(d[1])

def parse_time(t):
    '''
        parse time string and return seconds as float
    '''
    s = 0.0
    if isinstance(t, float) or isinstance(t, int):
        return s
    p = t.split(':')
    for i in range(len(p)):
        _p = p[i]
        if _p.endswith('.'):
            _p =_p[:-1]
        s = s * 60 + float(_p)
    return s

def plural_key(term):
    return {
        'country': 'countries',
    }.get(term, term + 's')

def sort_title(title):

    title = title.replace(u'Æ', 'Ae')
    if isinstance(title, str):
        title = unicode(title)
    title = sort_string(title)

    #title
    title = re.sub(u'[\'!¿¡,\.;\-"\:\*\[\]]', '', title)
    return title.strip()

def get_positions(ids, pos):
    '''
    >>> get_positions([1,2,3,4], [2,4])
    {2: 1, 4: 3}
    '''
    positions = {}
    for i in pos:
        try:
            positions[i] = ids.index(i)
        except:
            pass
    return positions

def get_by_key(objects, key, value):
    obj = filter(lambda o: o.get(key) == value, objects)
    return obj and obj[0] or None

def get_by_id(objects, id):
    return get_by_key(objects, 'id', id)
