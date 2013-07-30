# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import unicodedata

from django.db.models import Q, Manager
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
        'user': 'user__username',
        'place': 'places__id',
        'event': 'events__id',
        'in': 'start',
        'out': 'end',
        'id': 'public_id',
        'value': 'findvalue',
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
        if exclude:
            return ~q
        else:
            return q
    if k in ('places__id', 'events__id'):
        v = decode_id(v)
    if isinstance(v, bool): #featured and public flag
        key = k
    elif k in ('lat', 'lng', 'area', 'south', 'west', 'north', 'east', 'matches',
               'id', 'places__id', 'events__id'):
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



class AnnotationManager(Manager):

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

        #anonymous can only see public items
        public_layers = self.model.public_layers()

        if user.is_anonymous():
            qs = qs.filter(layer__in=public_layers)
        #users can see public and own
        else:
            qs = qs.filter(Q(layer__in=public_layers)|Q(user=user))
        return qs
