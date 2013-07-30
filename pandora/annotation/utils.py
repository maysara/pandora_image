# -*- coding: utf-8 -*-
# ci:si:et:sw=4:sts=4:ts=4
import ox

def cleanup_value(value, layer_type):
    #FIXME: what about other types? location etc
    if layer_type == 'text':
        value = ox.sanitize_html(value)
    else:
        value = ox.escape_html(value)
    return value

