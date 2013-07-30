# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from datetime import timedelta, datetime

from celery.task import periodic_task

import models

@periodic_task(run_every=timedelta(days=1), queue='encoding')
def cronjob(**kwargs):
    models.Log.objects.filter(modified__lt=datetime.now()-timedelta(days=30)).delete()
