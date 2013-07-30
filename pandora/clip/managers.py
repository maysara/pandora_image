# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import unicodedata

from django.db.models import Q, Manager
from django.conf import settings

from ox.django.query import QuerySet

from item.utils import decode_id


def parseCondition(condition, user):
    '''
    condition: {
            value: "war"
    }
    or
    condition: {
            key: "year",
            value: "1970-1980,
            operator: "!="
    }
    '''
    k = condition.get('key', 'name')
    k = {
        'event': 'annotations__events__id',
        'in': 'start',
        'out': 'end',
        'place': 'annotations__places__id',
        'text': 'findvalue',
        'annotations': 'findvalue',
        'user': 'annotations__user__username',
    }.get(k, k)
    if not k:
        k = 'name'
    v = condition['value']
    op = condition.get('operator')
    if not op:
        op = ''
    if k in settings.CONFIG.get('clipLayers', []):
        return parseCondition({'key': 'annotations__findvalue',
                               'value': v,
                               'operator': op}, user) \
             & parseCondition({'key': 'annotations__layer',
                               'value': k,
                               'operator': '=='}, user)

    if op.startswith('!'):
        op = op[1:]
        exclude = True
    else:
        exclude = False
    if op == '-':
        q = parseCondition({'key': k, 'value': v[0], 'operator': '>='}, user) \
            & parseCondition({'key': k, 'value': v[1], 'operator': '<'}, user)
        return exclude and ~q or q
    if (not exclude and op == '=' or op in ('$', '^', '>=', '<')) and v == '':
        return Q()

    if k == 'id':
        itemId, points = v.split('/')
        points = [float('%0.03f'%float(p)) for p in points.split('-')]
        q = Q(item__itemId=itemId, start=points[0], end=points[1])
        return exclude and ~q or q

    elif k.endswith('__id'):
        v = decode_id(v)
    if isinstance(v, bool): #featured and public flag
        key = k
    elif k in ('lat', 'lng', 'area', 'south', 'west', 'north', 'east', 'matches',
               'id') or k.endswith('__id'):
        key = "%s%s" % (k, {
            '>': '__gt',
            '>=': '__gte',
            '<': '__lt',
            '<=': '__lte',
        }.get(op, ''))
    else:
        key = "%s%s" % (k, {
            '>': '__gt',
            '>=': '__gte',
            '<': '__lt',
            '<=': '__lte',
            '==': '__iexact',
            '=': '__icontains',
            '^': '__istartswith',
            '$': '__iendswith',
        }.get(op, '__icontains'))

    key = str(key)
    if isinstance(v, unicode):
        v = unicodedata.normalize('NFKD', v).lower()
    if exclude:
        q = ~Q(**{key: v})
    else:
        q = Q(**{key: v})
    return q

def parseConditions(conditions, operator, user):
    '''
    conditions: [
        {
            value: "war"
        }
        {
            key: "year",
            value: "1970-1980,
            operator: "!="
        },
        {
            key: "country",
            value: "f",
            operator: "^"
        }
    ],
    operator: "&"
    '''
    conn = []
    for condition in conditions:
        if 'conditions' in condition:
            q = parseConditions(condition['conditions'],
                             condition.get('operator', '&'), user)
            if q:
                conn.append(q)
            pass
        else:
            conn.append(parseCondition(condition, user))
    if conn:
        q = conn[0]
        for c in conn[1:]:
            if operator == '|':
                q = q | c
            else:
                q = q & c
        return q
    return None



class ClipManager(Manager):

    def get_query_set(self):
        return QuerySet(self.model)

    def filter_annotations(self, data, user):
        keys = settings.CONFIG['clipLayers'] + ['annotations', 'text', '*']
        conditions = data.get('query', {}).get('conditions', [])
        conditions = filter(lambda c: c['key'] in keys, conditions)
        operator = data.get('query', {}).get('operator', '&')
        def parse(condition):
            key = "%s%s" % ('findvalue', {
                '>': '__gt',
                '>=': '__gte',
                '<': '__lt',
                '<=': '__lte',
                '==': '__iexact',
                '=': '__icontains',
                '^': '__istartswith',
                '$': '__iendswith',
            }.get(condition.get('opterator', ''), '__icontains'))
            v = condition['value']
            if isinstance(v, unicode):
                v = unicodedata.normalize('NFKD', v).lower()
            q = Q(**{key: v})
            if condition['key'] in settings.CONFIG['clipLayers']:
                q = q & Q(layer=condition['key'])
            return q
        conditions = map(parse, conditions)
        if conditions:
            q = conditions[0]
            for c in conditions[1:]:
                if operator == '|':
                    q = q | c
                else:
                    q = q & c
            return q
        return None

    def find(self, data, user):
        '''
            query: {
                conditions: [
                    {
                        value: "war"
                    }
                    {
                        key: "year",
                        value: "1970-1980,
                        operator: "!="
                    },
                    {
                        key: "country",
                        value: "f",
                        operator: "^"
                    }
                ],
                operator: "&"
            }
        '''

        #join query with operator
        qs = self.get_query_set()
        
        conditions = parseConditions(data.get('query', {}).get('conditions', []),
                                     data.get('query', {}).get('operator', '&'),
                                     user)
        if conditions:
            qs = qs.filter(conditions)
        if 'keys' in data:
            for l in filter(lambda k: k in settings.CONFIG['clipLayers'], data['keys']):
                qs = qs.filter(**{l: True})
        #anonymous can only see public clips
        if not user or user.is_anonymous():
            allowed_level = settings.CONFIG['capabilities']['canSeeItem']['guest']
            qs = qs.filter(sort__rightslevel__lte=allowed_level)
        #users can see public clips, there own clips and clips of there groups
        else:
            allowed_level = settings.CONFIG['capabilities']['canSeeItem'][user.get_profile().get_level()]
            q = Q(sort__rightslevel__lte=allowed_level)|Q(user=user.id)
            if user.groups.count():
                q |= Q(item__groups__in=user.groups.all())
            qs = qs.filter(q)
        #admins can see all available clips
        return qs
