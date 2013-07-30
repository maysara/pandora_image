#!/usr/bin/python
# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division
import os

root_dir = os.path.normpath(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# using virtualenv's activate_this.py to reorder sys.path
#activate_this = os.path.join(root_dir, 'bin', 'activate_this.py')
#execfile(activate_this, dict(__file__=activate_this))

import Image
import ImageDraw
import json
from optparse import OptionParser
import ox
from ox.image import drawText, getRGB, getTextSize, wrapText
import subprocess
import sys

static_root = os.path.join(os.path.dirname(__file__), 'data')

def get_frame(id, height, position):
    cmd = [
        os.path.join(root_dir, 'pandora', 'manage.py'), 'get_frame',
        str(id), str(height), "%f" % (round(position * 25) / 25)
    ]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    output = p.communicate()
    frame_path = output[0].strip()
    if frame_path:
        frame_image = Image.open(frame_path)
        return frame_image

def render_poster(data, poster):

    title = ox.decode_html(data.get('title', '')).upper()
    director = ox.decode_html(u', '.join(data.get('director', []))).upper()
    for key, value in {u'\u03a0': 'PI', u'ß': u'SS'}.iteritems():
        title = title.replace(key, value)
        director = director.replace(key, value)
    year = str(data.get('year', ''))
    duration = data.get('duration')
    oxdb_id = data['oxdbId']
    id = data['id']
    frame = data.get('frame')
    timeline = data.get('timeline')

    poster_size = (640, 1024)
    frame_size = (640, 480)
    frame_ratio = frame_size[0] / frame_size[1]
    logo_size = (64, 32)
    small_frames = 8
    small_frame_size = (80, 64)
    small_frame_ratio = small_frame_size[0] / small_frame_size[1]
    timeline_size = (640, 32)
    margin = 16
    font_size_small = 32
    font_size_large = 48
    font_file = os.path.join(static_root, 'MontserratBold.ttf')
    hue = int(oxdb_id[2:10], 16) / pow(2, 32) * 360
    image_color = getRGB([hue, 1, 0.2])
    background_color = getRGB([hue, 1, 0.4])
    foreground_color = getRGB([hue, 1, 0.8])
    poster_image = Image.new('RGB', poster_size)
    draw = ImageDraw.Draw(poster_image)

    # frame
    if frame:
        frame_image = Image.open(frame)
        frame_image_ratio = frame_image.size[0] / frame_image.size[1]
        if frame_ratio < frame_image_ratio:
            frame_image = frame_image.resize((int(frame_size[1] * frame_image_ratio), frame_size[1]), Image.ANTIALIAS)
            left = int((frame_image.size[0] - frame_size[0]) / 2)
            frame_image = frame_image.crop((left, 0, left + frame_size[0], frame_size[1]))
        else:
            frame_image = frame_image.resize((frame_size[0], int(frame_size[0] / frame_image_ratio)), Image.ANTIALIAS)
            top = int((frame_image.size[1] - frame_size[1]) / 2)
            frame_image = frame_image.crop((0, top, frame_size[0], top + frame_size[1]))
        poster_image.paste(frame_image, (0, 0))
    else:
        draw.rectangle(((0, 0), frame_size), fill=image_color)

    # logo
    logo_image = Image.open(os.path.join(static_root, 'logo.0xdb.png'))
    logo_image = logo_image.resize(logo_size, Image.ANTIALIAS)
    for y in range(logo_size[1]):
        for x in range(logo_size[0]):
            poster_color = poster_image.getpixel((margin + x, margin + y))
            logo_lightness = logo_image.getpixel((x, y))[0] / 255
            logo_alpha = logo_image.getpixel((x, y))[3] / 255
            logo_color = getRGB([hue, 1, logo_lightness])
            color = tuple([int(logo_color[i] * logo_alpha + poster_color[i] * (1 - logo_alpha)) for i in range(3)])
            poster_image.putpixel((margin + x, margin + y), color)

    # small frames
    if duration:
        for i in range(small_frames):
            position = duration * (i + 1) / (small_frames + 1)
            small_frame_image = get_frame(id, 96, round(position * 25) / 25)
            if small_frame_image:
                small_frame_image_ratio = small_frame_image.size[0] / small_frame_image.size[1]
                if small_frame_ratio < small_frame_image_ratio:
                    small_frame_image = small_frame_image.resize((int(small_frame_size[1] * small_frame_image_ratio), small_frame_size[1]), Image.ANTIALIAS)
                    left = int((small_frame_image.size[0] - small_frame_size[0]) / 2)
                    small_frame_image = small_frame_image.crop((left, 0, left + small_frame_size[0], small_frame_size[1]))
                else:
                    small_frame_image = small_frame_image.resize((small_frame_size[0], int(small_frame_size[0] / small_frame_image_ratio)), Image.ANTIALIAS)
                    top = int((small_frame_image.size[1] - small_frame_size[1]) / 2)
                    small_frame_image = small_frame_image.crop((0, top, small_frame_size[0], top + small_frame_size[1]))
                poster_image.paste(small_frame_image, (i * small_frame_size[0], frame_size[1]))
    else:
        draw.rectangle(((0, frame_size[1]), (poster_size[0], frame_size[1] + small_frame_size[1])), fill=image_color)

    # text
    draw.rectangle(((0, frame_size[1] + small_frame_size[1]), (poster_size[0], poster_size[1] - timeline_size[1])), fill=background_color)
    offset_top = frame_size[1] + small_frame_size[1] + margin - 8
    text_height = poster_size[1] - frame_size[1] - small_frame_size[1] - 3 * margin - font_size_large - timeline_size[1]
    if not director:
        title_max_lines = int(text_height / font_size_large)
    else:
        title_max_lines = min(len(wrapText(
            title,
            poster_size[0] - 2 * margin,
            0,
            font_file,
            font_size_large
        )), int((text_height - margin - font_size_small - 8) / font_size_large))
        director_max_lines = int((text_height - title_max_lines * font_size_large) / font_size_small)

    # title
    lines = wrapText(
        title,
        poster_size[0] - 2 * margin,
        title_max_lines,
        font_file,
        font_size_large
    )
    for line in lines:
        drawText(
            poster_image,
            (margin, offset_top),
            line,
            font_file,
            font_size_large,
            foreground_color
        )
        offset_top += font_size_large
    offset_top += margin

    # director
    if director:
        lines = wrapText(
            director,
            poster_size[0] - 2 * margin,
            director_max_lines,
            font_file,
            font_size_small
        )
        for line in lines:
            drawText(
                poster_image,
                (margin, offset_top),
                line,
                font_file,
                font_size_small,
                foreground_color
            )
            offset_top += font_size_small

    # year
    if year:
        drawText(
            poster_image,
            (margin, poster_size[1] - timeline_size[1] - margin - font_size_large),
            year,
            font_file,
            font_size_large,
            foreground_color
        )

    # id
    drawText(
        poster_image,
        (
            poster_size[0] - margin - getTextSize(poster_image, id, font_file, font_size_small)[0],
            poster_size[1] - timeline_size[1] - margin - font_size_small
        ),
        id,
        font_file,
        font_size_small,
        foreground_color
    )

    # timeline
    if timeline:
        timeline_image = Image.open(timeline)
        timeline_image = timeline_image.resize(timeline_size, Image.ANTIALIAS)
        poster_image.paste(timeline_image, (0, poster_size[1] - timeline_size[1]))
    else:
        draw.rectangle(((0, poster_size[1] - timeline_size[1]), poster_size), fill=image_color)

    poster_image.save(poster)

def main():
    parser = OptionParser()
    parser.add_option('-d', '--data', dest='data', help='json file with metadata', default=None)
    parser.add_option('-p', '--poster', dest='poster', help='Poster (image file to be written)')
    (options, args) = parser.parse_args()

    if None in (options.data, options.poster):
        parser.print_help()
        sys.exit()

    if options.data == '-':
        data = json.load(sys.stdin)
    else:
        with open(options.data) as f:
            data = json.load(f)
    render_poster(data, options.poster)

if __name__ == "__main__":
    main()

