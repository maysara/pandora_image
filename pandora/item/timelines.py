# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from __future__ import division, with_statement

import math
import os
import re

import Image
from ox.utils import json


def join_tiles(source_paths, target_path):
    '''
    This is an implementation of a join_tiles function for new-style timelines.
    Timelines of files will be read from source_paths, the timeline of the item will
    be written to target_path.
    '''

    def divide(num, by):
        # divide(100, 3) -> [33, 33, 34]
        arr = []
        div = int(num / by)
        mod = num % by
        for i in range(int(by)):
            arr.append(div + (i > by - 1 - mod))
        return arr

    def get_file_info(file_name):
        for mode in modes:
            if re.match('^timeline' + mode + '64p\d+\.jpg', file_name):
                return {
                    'file': file_name,
                    'mode': mode,
                    'index': int(file_name[11 + len(mode):-4])
                }
        return None

    def save_and_open(data):
        # whenever a large tile is done or needed,
        # this function saves the previous large tile
        # (if any) and opens the next one (if any).
        # in between, whenever required, small tiles
        # are opened, rendered and saved, and the
        # large full tile is being generated.
        # 'keyframes' are only rendered in large size,
        # 'keyframeswide' only resized to small size.
        image_mode = 'L' if mode == 'audio' else 'RGB'
        small_mode = 'keyframes' if mode == 'keyframeswide' else mode
        large_tile_i = int(target_w / large_tile_w)
        # save previous large tile
        if large_tile_i > 0:
            large_tile_i -= 1
            if mode != 'keyframeswide':
                image_file = '%stimeline%s%dp%d.jpg' % (
                    target_path, mode, large_tile_h, large_tile_i
                )
                data['target_images']['large'].save(image_file)
                #print image_file
            if mode != 'keyframes':
                # open small tile
                small_tile_i = int(large_tile_i / 60)
                small_tile_x = (large_tile_i % 60) * 60
                if small_tile_x == 0:
                    if small_tile_i < small_tile_n - 1:
                        w = small_tile_w
                    else:
                        w = small_tile_last_w
                    data['target_images']['small'] = Image.new(image_mode, (w, small_tile_h))
                # paste large tile into small tile
                w = 60 if large_tile_i < large_tile_n - 1 else small_tile_last_w % 60
                data['target_images']['large'] = data['target_images']['large'].resize(
                    (w, small_tile_h), Image.ANTIALIAS
                )
                data['target_images']['small'].paste(
                    data['target_images']['large'], (small_tile_x, 0)
                )
                # save small tile
                if small_tile_x == small_tile_w - 60 or large_tile_i == large_tile_n - 1:
                    image_file = '%stimeline%s%dp%d.jpg' % (
                        target_path, small_mode, small_tile_h, small_tile_i
                    )
                    data['target_images']['small'].save(image_file)
                    #print image_file
            if mode == 'antialias':
                # render full tile
                resized = data['target_images']['large'].resize((
                    data['full_tile_widths'][0], large_tile_h
                ), Image.ANTIALIAS)
                data['target_images']['full'].paste(resized, (data['full_tile_offset'], 0))
                data['full_tile_offset'] += data['full_tile_widths'][0]
                data['full_tile_widths'] = data['full_tile_widths'][1:]
            large_tile_i += 1
        # open next large tile
        if large_tile_i < large_tile_n:
            w = large_tile_w if large_tile_i < large_tile_n - 1 else large_tile_last_w
            data['target_images']['large'] = Image.new(image_mode, (w, large_tile_h))

    data = {}
    fps = 25
    large_tile_w, large_tile_h = 1500, 64
    small_tile_w, small_tile_h = 3600, 16
    full_tile_w = 1920
    modes = ['antialias', 'slitscan', 'keyframes', 'keyframeswide', 'audio']
    source_files = {}
    for mode in modes:
        source_files[mode] = []

    # read files
    durations = [0] * len(source_paths)
    frame_n = 0
    for i, path in enumerate(source_paths):
        file_info = map(get_file_info, os.listdir(path))
        file_info = filter(lambda x: x != None, file_info)
        for info in sorted(file_info, key=lambda x: x['index']):
            mode = info['mode']
            source_files[mode].append(path + info['file'])
            if mode == modes[0]:
                width = Image.open(source_files[mode][-1]).size[0]
                durations[i] += width / fps
                frame_n += width
    large_tile_n = int(math.ceil(frame_n / large_tile_w)) 
    large_tile_last_w = frame_n % large_tile_w or 60
    small_tile_n = int(math.ceil(frame_n / fps / small_tile_w)) 
    small_tile_last_w = int(math.ceil(frame_n / fps)) % small_tile_w or small_tile_w

    # open full timeline
    if large_tile_n == 1:
        data['full_tile_widths'] = [large_tile_last_w]
    else:
        w = full_tile_w
        n = large_tile_n
        if large_tile_last_w < large_tile_w:
            factor = full_tile_w / frame_n
            last_w = int(round(large_tile_last_w * factor))
            w -= last_w
            n -= 1
        data['full_tile_widths'] = divide(w, n)
        if large_tile_last_w < large_tile_w:
            data['full_tile_widths'].append(last_w)
    data['full_tile_offset'] = 0
    full_tile_image = Image.new('RGB', (full_tile_w, large_tile_h))

    # main loop
    data['target_images'] = {'large': None, 'small': None, 'full': full_tile_image}
    for mode in modes:
        target_w = 0
        for source_file in source_files[mode]:
            source_image = Image.open(source_file)
            source_w = source_image.size[0]
            target_x = target_w % large_tile_w
            if target_x == 0:
                save_and_open(data)
            data['target_images']['large'].paste(source_image, (target_x, 0))
            target_w += source_w
            if target_x + source_w > large_tile_w:
                # target tile overflows into next source tile
                save_and_open(data)
                target_x -= large_tile_w
                data['target_images']['large'].paste(source_image, (target_x, 0))
        # save_and_open saves previous tile and opens tile at target_w
        # increase target_w to be in next tile
        target_w += large_tile_w
        save_and_open(data)

    # save full timelines
    image_file = '%stimelineantialias%dp.jpg' % (target_path, large_tile_h)
    data['target_images']['full'].save(image_file)
    #print image_file
    image_file = '%stimelineantialias%dp.jpg' % (target_path, small_tile_h)
    data['target_images']['full'].resize(
        (full_tile_w, small_tile_h), Image.ANTIALIAS
    ).save(image_file)
    #print image_file

    # join cuts
    cuts = []
    offset = 0
    for i, path in enumerate(source_paths):
        p = os.path.join(path, 'cuts.json')
        if os.path.exists(p):
            with open(p, 'r') as f:
                path_cuts = json.load(f)
        else:
            print p, 'missing'
            path_cuts = []
        if i > 0:
            cuts.append(offset)
        for cut in path_cuts:
            cuts.append(offset + cut)
        offset += durations[i]
    with open(os.path.join(target_path, 'cuts.json'), 'w') as f:
        # avoid float rounding artefacts
        f.write('[' + ', '.join(map(lambda x: '%.2f' % x, cuts)) + ']')

def split_tiles(path, paths, durations):

    def is_timeline_file(file_name):
        return file_name.startswith('timeline') and file_name.endswith('.png')

    file_names = filter(is_timeline_file, os.listdir(path))
    tiles = {}
    for file_name in file_names:
        mode = re.split('\d+', file_name[8:])[0]
        print file_name, mode
        split = re.split('[a-z]+', file_name[8 + len(mode):-4])
        height, index = map(lambda x: int(x) if len(x) else -1, split)
        if not mode in tiles:
            tiles[mode] = {}
        if not height in tiles[mode]:
            tiles[mode][height] = 0
        if index + 1 > tiles[mode][height]:
            tiles[mode][height] = index + 1
    print tiles

    # for each mode
    for mode in tiles:
        image_mode = 'L' if mode == 'audio' else 'RGB'
        # and for each size of that mode
        for i, height in enumerate(tiles[mode]):
            tile_width = 1500 if i == 0 else 3600
            px_per_sec = 25 if i == 0 else 1
            target_images = []
            target_data = []
            # and for each split item
            for item_index, duration in enumerate(durations):
                tile_index = 0
                px = int(math.ceil(duration * px_per_sec))
                # create a flat list of all target images   
                # (and store the split item and tile index)
                while px:
                    width = tile_width if px > tile_width else px
                    target_images.append(
                        Image.new(image_mode, (width, height))
                    )
                    target_data.append(
                        {'item': item_index, 'tile': tile_index}
                    )
                    tile_index += 1
                    px -= width
            target_index = 0
            offset = 0
            # for each source tile
            for source_index in range(tiles[mode][height]):
                source_image = Image.open('%stimeline%s%dp%d.png' % (
                    path, mode, height, source_index
                ))
                source_width = source_image.size[0]
                target_width = target_images[target_index].size[0]
                target_images[target_index].paste(source_image, (offset, 0))
                # paste it into as many target tiles as needed
                while source_width + offset > target_width:
                    offset -= target_width
                    target_index += 1
                    target_width = target_images[target_index].size[0]
                    target_images[target_index].paste(source_image, (offset, 0))
            for i, target_image in enumerate(target_images):
                file_name = '%stimeline%s%dp%d' % (
                    paths[target_data[i]['item']], mode, height, target_data[i]['tile']
                )
                # target_image.save(file_name)
                print file_name, target_image.size

