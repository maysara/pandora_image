import models
import item.models
import user.models
import archive.models

def recover_item(id):
    if item.models.Item.objects.filter(itemId=id).exists():
        raise Exception('id is taken')
    qs = models.Changelog.objects.filter(value__contains='id": "%s"' % id)
    if not qs.exists():
        raise Exception('id not found')
    old = qs.order_by('-created')[0]
    i = item.models.Item()
    i.itemId = id
    i.data = old.value
    created = old.value['created']
    i.user = user.models.User.objects.get(username=i.data['user'])
    for key in [
         u'rendered',
         u'random',
         u'cuts',
         u'duration',
         u'id',  
         u'size',
         u'posterFrame',
         u'parts',
         u'cutsperminute',
         u'hue', 
         u'numberofcuts',
         u'durations',
         u'volume',
         u'user',
         u'words',
         u'videoRatio',
         u'aspectratio',
         u'bitrate',
         u'pixels',
         u'created',
         u'numberoffiles',
         u'modified',
         u'timesaccessed',
         u'accessed',
         u'resolution',
         u'wordsperminute',
         u'posterRatio'
    ]:
        if key in i.data:
            del i.data[key]
    i.save()
    i.itemId = id
    i.created = created
    i.save()
    i.update_sort()
    i.update_find()
    print 'created', i, i.id

    for a in models.Changelog.objects.filter(value__contains='id": "%s/' % id).order_by('created'):
        qs = i.annotations.filter(public_id=a.value['id'])
        if qs.exists():
            annot = qs[0]
        else:
            annot = item.models.Annotation()
            annot.item = i
            annot.public_id = a.value['id']
        annot.created = a.value['created']
        annot.modified = a.value['modified']
        annot.user = user.models.User.objects.get(username=a.value['user'])
        annot.start = a.value['in']
        annot.end = a.value['out']
        annot.value = a.value['value']
        annot.layer = a.value.get('layer', 'transcripts')
        annot.save()
    return i

def recover_file(id, oshash, filename):
    i = item.models.Item.objects.get(itemId=id)
    file, created = archive.models.File.objects.get_or_create(oshash=oshash)
    if created:
        file.item = i
        file.path = filename
        file.wanted = True
        file.selected = True
        extension = file.path.split('.')
        if len(extension) > 1:
            extension = extension[-1]
        else:
            extension = 'webm'
        file.info['extension'] = extension.lower()
        file.save()
    else:
        raise Exception('file exists', oshash)
    return file
