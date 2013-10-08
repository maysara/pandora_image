# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from django.db.models import Q, Manager

from ox.django.query import QuerySet

from item.utils import decode_id

import models


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
        'in': 'start',
        'out': 'end'
    }.get(k, k)
    if not k:
        k = 'name'
    v = condition['value']
    op = condition.get('operator')
    if not op:
        op = ''

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
        q = Q(sort__item__itemId=itemId, start=points[0], end=points[1])
        return exclude and ~q or q
    if k == 'hash':
        v =  models.parse_hash(v)
    if k == 'mode':
        v = models.Sequence.MODE[v]
    if k.endswith('__id'):
        v = decode_id(v)
    if isinstance(v, bool): #featured and public flag
        key = k
    else:
        if k in ('mode', 'hash'):
            key = k
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



class SequenceManager(Manager):

    def get_query_set(self):
        return QuerySet(self.model)

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

        return qs
