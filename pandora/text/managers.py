# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from django.db.models import Q, Manager


def parseCondition(condition, user):
    '''
    '''
    k = condition.get('key', 'name')
    k = {
        'user': 'user__username',
        'position': 'position__position',
        'posterFrames': 'poster_frames',
    }.get(k, k)
    if not k:
        k = 'name'
    v = condition['value']
    op = condition.get('operator')
    if not op:
        op = '='
    if op.startswith('!'):
        op = op[1:]
        exclude = True
    else:
        exclude = False
    if k == 'id':
        v = v.split(":")
        if len(v) >= 2:
            v = (v[0], ":".join(v[1:]))
            q = Q(user__username=v[0], name=v[1])
        else:
            q = Q(id__in=[])
        return q
    if k == 'subscribed':
        key = 'subscribed_users__username'
        v = user.username
    elif isinstance(v, bool): #featured and public flag
        key = k
    else:
        key = "%s%s" % (k, {
            '==': '__iexact',
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


class TextManager(Manager):

    def get_query_set(self):
        return super(TextManager, self).get_query_set()

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
        conditions = parseConditions(data['query'].get('conditions', []),
                                     data['query'].get('operator', '&'),
                                     user)
        if conditions:
            qs = qs.filter(conditions)

        if user.is_anonymous():
            qs = qs.filter(Q(status='public') | Q(status='featured'))
        else:
            qs = qs.filter(Q(status='public') | Q(status='featured') | Q(user=user))
        return qs

