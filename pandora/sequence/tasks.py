# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from django.db import connection, transaction
from celery.task import task

import models
import item.models
import extract

@task(ignore_results=True, queue='encoding')
def get_sequences(itemId):
    i = item.models.Item.objects.get(itemId=itemId)
    models.Sequence.objects.filter(sort=i.sort).delete()
    position = 0
    for stream in i.streams():
        #data, position = extract.get_sequences(stream.timeline_prefix, position)
        data, position = extract.get_cut_sequences(stream, position)
        keys = None
        values = []
        for mode in data:
            for s in data[mode]:
                sequence = {
                    'sort_id': i.sort.pk,
                    'mode': models.Sequence.MODE[mode],
                    'start': float('%0.03f' % s['in']),
                    'end': float('%0.03f' % s['out']),
                    'hash': models.parse_hash(s['hash'])
                }
                sequence['duration'] = sequence['end'] - sequence['start']
                if not keys:
                    keys = ', '.join(['"%s"'%k for k in sequence.keys()])
                v = ', '.join([isinstance(v, basestring) and "'%s'"%v or str(v)
                               for v in sequence.values()])
                values.append('(%s)'%v)
        if values:
            cursor = connection.cursor()
            sql = "INSERT INTO sequence_sequence (%s) VALUES %s" % (keys, ', '.join(values));
            cursor.execute(sql)
            transaction.commit_unless_managed()

