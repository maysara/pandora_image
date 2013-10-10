# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division
import Image
import os

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

class DataTimeline():
    fps = 25
    def __init__(self, path):
        file_names = filter(lambda x: 'timelinedata8p' in x, os.listdir(path))
        file_names = sorted(file_names, key=lambda x: int(x[14:-4]))
        file_names = map(lambda x: path + x, file_names)
        self.file_names = file_names
        self.timeline_image = Image.open(file_names[0])
        self.timeline_width = self.timeline_image.size[0]
        self.current_tile = 0

    def get_frame(self, pos):
        frame = int(pos * self.fps)
        tile = int(frame * 8 / self.timeline_width)
        if self.current_tile != tile:
            self.timeline_image = Image.open(self.file_names[tile])
            self.current_tile = tile
        x = frame * 8 - tile * self.timeline_width
        return self.timeline_image.crop((x, 0, x + 8, 8))

def get_cut_sequences(stream, position=0):
    timeline = DataTimeline(stream.timeline_prefix)
    cuts = list(stream.cuts) + [stream.duration]
    modes = ['color', 'shape']
    sequences = {}
    for mode in modes:
        sequences[mode] = []

    position = 0
    for cut in cuts:
        center = position + (cut - position) / 2
        center -= center % 0.04
        frame_image = timeline.get_frame(center)
        for mode in modes:
            frame_hash = get_hash(frame_image, mode)
            sequences[mode].append({
                'hash': frame_hash,
                'in': position,
                'out': cut,
            })
        position = cut
    return sequences, position
