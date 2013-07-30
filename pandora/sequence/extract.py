# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division
import Image
import os
import numpy
import math

ZONE_INDEX = []
for pixel_index in range(64):
    x, y = pixel_index % 8, int(pixel_index / 8)
    ZONE_INDEX.append(int(x / 2) + int(y / 4) * 4)

def get_hash(image, mode):
    image_hash = 0
    if mode == 'color':
        # divide the image into 8 zones:
        # 0 0 1 1 2 2 3 3
        # 0 0 1 1 2 2 3 3
        # 0 0 1 1 2 2 3 3
        # 0 0 1 1 2 2 3 3
        # 4 4 5 5 6 6 7 7
        # 4 4 5 5 6 6 7 7
        # 4 4 5 5 6 6 7 7
        # 4 4 5 5 6 6 7 7
        image_data = image.getdata()
        zone_values = []
        for zone_index in range(8):
            zone_values.append([])
        for pixel_index, pixel_value in enumerate(image_data):
            zone_values[ZONE_INDEX[pixel_index]].append(pixel_value)
        for zone_index, pixel_values in enumerate(zone_values):
            # get the mean for each color channel
            mean = map(lambda x: int(round(sum(x) / 8)), zip(*pixel_values))
            # store the mean color of each zone as an 8-bit value:
            # RRRGGGBB
            color_index = sum((
                int(mean[0] / 32) << 5,
                int(mean[1] / 32) << 2,
                int(mean[2] / 64)
            ))
            image_hash += color_index * pow(2, zone_index * 8)
    elif mode == 'shape':
        # pixels brighter than the mean register as 1,
        # pixels equal to or darker than the mean as 0
        image_data = image.convert('L').getdata()
        image_mean = sum(image_data) / 64
        for pixel_index, pixel_value in enumerate(image_data):
            if pixel_value > image_mean:
                image_hash += pow(2, pixel_index)
    image_hash = hex(image_hash)[2:].upper()
    if image_hash.endswith('L'):
        image_hash = image_hash[:-1]
    image_hash = '0' * (16 - len(image_hash)) + image_hash
    return image_hash

def get_sequences(path, position=0):
    modes = ['color', 'shape']
    sequences = {}
    for mode in modes:
        sequences[mode] = []
    position_start = position
    fps = 25
    file_names = filter(lambda x: 'timelinedata8p' in x, os.listdir(path))
    file_names = sorted(file_names, key=lambda x: int(x[14:-4]))
    file_names = map(lambda x: path + x, file_names)
    for file_name in file_names:
        timeline_image = Image.open(file_name)
        timeline_width = timeline_image.size[0]
        for x in range(0, timeline_width, 8):
            frame_image = timeline_image.crop((x, 0, x + 8, 8))
            for mode in modes:
                frame_hash = get_hash(frame_image, mode)
                if position == position_start or frame_hash != sequences[mode][-1]['hash']:
                    if position > position_start:
                        sequences[mode][-1]['out'] = position
                    sequences[mode].append({'in': position, 'hash': frame_hash})
            position += 1 / fps
    for mode in modes:
        if sequences[mode]:
            sequences[mode][-1]['out'] = position
    return sequences, position

def get_cut_sequences(stream, position=0):
    path = stream.timeline_prefix
    cuts = list(stream.cuts) + [stream.duration]
    modes = ['color', 'shape']
    sequences = {}
    for mode in modes:
        sequences[mode] = []
    position_start = position
    fps = 25
    file_names = filter(lambda x: 'timelinedata8p' in x, os.listdir(path))
    file_names = sorted(file_names, key=lambda x: int(x[14:-4]))
    file_names = map(lambda x: path + x, file_names)

    def add_hash(cut, cut_data):
        if sequences['color']:
            start = sequences['color'][-1]['out']
        else:
            start = 0
        end = position
        frames = int(math.ceil((end - start) * fps))
        #print 'add', start, end, frames
        if frames:
            cut_data /= frames
            frame_image = Image.new('RGB', (8,8))
            frame_image.putdata(list(tuple(pixel) for pixel in cut_data))
            for mode in modes:
                frame_hash = get_hash(frame_image, mode)
                if sequences[mode] and sequences[mode][-1]['hash'] == frame_hash:
                     sequences[mode][-1]['out'] = end
                else:
                    sequences[mode].append({
                        'hash': frame_hash,
                        'in': start,
                        'out': end,
                    })
        else:
            print 'fixme', cut_data

    def next_cut():
        if cuts:
            cut = cuts.pop(0)
        else:
            cut = 0
        return numpy.array(Image.new('RGB', (8,8)).getdata(), numpy.int64), cut

    cut_data, cut = next_cut()

    for file_name in file_names:
        timeline_image = Image.open(file_name)
        timeline_width = timeline_image.size[0]
        for x in range(0, timeline_width, 8):
            frame_image = timeline_image.crop((x, 0, x + 8, 8))
            cut_data += numpy.array(frame_image.getdata(), numpy.int64)
            position += 1 / fps
            if cut and position > cut:
                add_hash(cut, cut_data)
                cut_data, cut = next_cut()
    position += 1 / fps
    add_hash(cut, cut_data)
    return sequences, position
