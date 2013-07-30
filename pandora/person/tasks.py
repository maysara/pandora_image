# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from celery.task import task

import models


@task(ignore_results=True, queue='default')
def update_itemsort(id):
    p = models.Person.objects.get(pk=id)
    p.update_itemsort()

@task(ignore_results=True, queue='default')
def update_file_paths(id):
    from item.models import Item
    from item.tasks import update_file_paths
    p = models.Person.objects.get(pk=id)
    for i in Item.objects.filter(find__value__icontains=p.name).distinct():
        update_file_paths(i.itemId)
