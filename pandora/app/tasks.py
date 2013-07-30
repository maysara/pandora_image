# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import datetime

from celery.task import periodic_task
from celery.schedules import crontab


@periodic_task(run_every=crontab(hour=6, minute=0), queue='encoding')
def cron(**kwargs):
    from django.db import transaction
    from django.contrib.sessions.models import Session
    Session.objects.filter(expire_date__lt=datetime.datetime.now()).delete()
    transaction.commit_unless_managed()
