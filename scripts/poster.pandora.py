#!/usr/bin/python
# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division
import os

root_dir = os.path.normpath(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# using virtualenv's activate_this.py to reorder sys.path
activate_this = os.path.join(root_dir, 'bin', 'activate_this.py')
execfile(activate_this, dict(__file__=activate_this))

import Image
import ImageDraw
import json
from optparse import OptionParser
import ox
from ox.image import drawText, wrapText
import sys

static_root = os.path.join(os.path.dirname(__file__), 'data')

def render_poster(data, poster):

    title = ox.decode_html(data.get('title', ''))
    director = ox.decode_html(u', '.join(data.get('director', [])))
    year = str(data.get('year', ''))
    series = data.get('isSeries', False)
    oxdb_id = data['oxdbId']
    imdb_id = data['id']
    frame = data.get('frame')
    timeline = data.get('timeline')

    def get_oxdb_color(oxdb_id, series=False):
        i = int(round((int(oxdb_id[2:10], 16) * 762 / pow(2, 32))))
        if i < 127:
            color = (127, i, 0)
        elif i < 254:
            color = (254 - i, 127, 0)
        elif i < 381:
            color = (0, 127, i - 254)
        elif i < 508:
            color = (0, 508 - i, 127)
        elif i < 635:
            color = (i - 508, 0, 127)
        else:
            color = (127, 0, 762 - i)
        if series:
            color = tuple(map(lambda x: x + 128, color))
        return color

    poster_width = 640
    poster_height = 1024
    poster_ratio = poster_width / poster_height
    poster_image = Image.new('RGB', (poster_width, poster_height))
    draw = ImageDraw.Draw(poster_image)
    font_file = os.path.join(static_root, 'DejaVuSansCondensedBold.ttf')

    font_size = {
        'small': 28,
        'large': 42,
    }

    # frame
    frame_width = poster_width
    frame_ratio = 4 / 3
    frame_height = int(round(frame_width / frame_ratio))
    if frame:
        frame_image = Image.open(frame)
        frame_image_ratio = frame_image.size[0] / frame_image.size[1]
        if frame_ratio < frame_image_ratio:
            frame_image = frame_image.resize((int(frame_height * frame_image_ratio), frame_height), Image.ANTIALIAS)
            left = int((frame_image.size[0] - frame_width) / 2)
            frame_image = frame_image.crop((left, 0, left + frame_width, frame_height))
        else:
            frame_image = frame_image.resize((frame_width, int(frame_width / frame_image_ratio)), Image.ANTIALIAS)
            top = int((frame_image.size[1] - frame_height) / 2)
            frame_image = frame_image.crop((0, top, frame_width, top + frame_height))
        poster_image.paste(frame_image, (0, 0))

    # timeline
    timeline_width = poster_width
    timeline_height = 64
    if timeline:
        timeline_image = Image.open(timeline)
        timeline_image = timeline_image.resize((timeline_width, timeline_height), Image.ANTIALIAS)
        poster_image.paste(timeline_image, (0, frame_height))

    # text
    text_width = poster_width
    text_height = poster_height - frame_height - timeline_height
    text_top = frame_height + timeline_height
    text_bottom = text_top + text_height
    text_margin = 16
    text_color = get_oxdb_color(oxdb_id, series)
    font_color = tuple(map(lambda x: x - 128 if series else x + 128, text_color))
    draw.rectangle([(0, text_top), (text_width, text_bottom)], fill=text_color)
    offset_top = text_top + text_margin
    if not director:
        title_max_lines = 7
    else:
        title_max_lines = min(len(wrapText(title, text_width - 2 * text_margin, 0, font_file, font_size['large'])), 6)
        director_max_lines = 9 - int((title_max_lines * 3 - 1) / 2)
    if director:
        lines = wrapText(director, text_width - 2 * text_margin, director_max_lines, font_file, font_size['small'])
        for i, line in enumerate(lines):
            size = drawText(poster_image, (text_margin, offset_top), line, font_file, font_size['small'], font_color)
            offset_top += font_size['small'] + 2
        offset_top += size[1] - font_size['small'] + text_margin / 2
    lines = wrapText(title, text_width - 2 * text_margin, title_max_lines, font_file, font_size['large'])
    for i, line in enumerate(lines):
        size = drawText(poster_image, (text_margin, offset_top + 5), line, font_file, font_size['large'], font_color)
        offset_top += font_size['large'] + 3
    offset_top += size[1] - font_size['small'] + text_margin / 2
    if year:
        drawText(poster_image, (text_margin, offset_top), year, font_file, font_size['small'], font_color)
    item_id = imdb_id or oxdb_id
    drawText(poster_image, (text_margin, text_bottom - text_margin - font_size['large'] + 2), item_id, font_file, font_size['large'], font_color)

    '''
    # logo
    logo_height = 32
    logo_image = Image.open(os.path.join(static_root, '..', '..', 'static', 'png', 'logo.png'))
    logo_width = int(round(logo_height * logo_image.size[0] / logo_image.size[1]))
    logo_image = logo_image.resize((logo_width, logo_height), Image.ANTIALIAS)
    logo_left = text_width - text_margin - logo_width
    logo_top = text_bottom - text_margin - logo_height
    for y in range(logo_height):
        for x in range(logo_width):
            poster_color = poster_image.getpixel((logo_left + x, logo_top + y))
            logo_color = logo_image.getpixel((x, y))[0]
            alpha = logo_image.getpixel((x, y))[3]
            if series:
                poster_color = tuple(map(lambda x: int(x - (logo_color - 16) * alpha / 255), poster_color))
            else:
                poster_color = tuple(map(lambda x: int(x + (logo_color - 16) * alpha / 255), poster_color))
            poster_image.putpixel((logo_left + x, logo_top + y), poster_color)
i   '''
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

