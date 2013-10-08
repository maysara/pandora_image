// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.clipList = function(videoRatio) {

    var ui = pandora.user.ui,
        fixedRatio = !ui.item ? pandora.site.video.previewRatio : videoRatio,
        isClipView = !ui.item ? ui.listView == 'clip' : ui.itemView == 'clips',
        isEmbed = pandora.isEmbedURL(),
        that = Ox.IconList({
            draggable: true,
            find: !ui.item ? pandora.getItemFind(ui.find) : ui.itemFind,
            fixedRatio: fixedRatio,
            item: function(data, sort, size) {
                size = size || 128; // fixme: is this needed?
                var ratio, width, height,
                    format, info, sortKey, title, url;
                if (!ui.item) {
                    ratio = data.videoRatio;
                    width = ratio > fixedRatio ? size : Math.round(size * ratio / fixedRatio);
                    height = Math.round(width / ratio);
                } else {
                    width = fixedRatio > 1 ? size : Math.round(size * fixedRatio);
                    height = fixedRatio > 1 ? Math.round(size / fixedRatio) : size;
                }
                title = data.annotations ? data.annotations.sort(function(a, b) {
                    var layerA = pandora.site.clipLayers.indexOf(a.layer),
                        layerB = pandora.site.clipLayers.indexOf(b.layer);
                    return layerA < layerB ? -1
                        : layerA > layerB ? 1
                        : a.value < b.value ? -1
                        : a.value > b.value ? 1
                        : 0;
                }).map(function(annotation) {
                    return Ox.stripTags(annotation.value.replace(/\n/g, ' '));
                }).join('; ') : '';
                url = '/' + data.id.split('/')[0] + '/' + height + 'p' + data['in'] + '.jpg';
                sortKey = sort[0].key;
                if (['text', 'position', 'duration', 'random'].indexOf(sortKey) > -1) {
                    info = Ox.formatDuration(data['in']) + ' - '
                        + Ox.formatDuration(data.out);
                } else {
                    format = pandora.getSortKeyData(sortKey).format;
                    if (format) {
                        info = (
                            /^color/.test(format.type.toLowerCase()) ? Ox.Theme : Ox
                        )['format' + Ox.toTitleCase(format.type)].apply(
                            this, [data[sortKey]].concat(format.args || [])
                        );
                        if (sortKey == 'rightslevel') {
                            info.css({width: size * 0.75 + 'px'});
                        }
                    } else {
                        info = data[sortKey];
                    }
                }
                return {
                    height: height,
                    id: data.id,
                    info: info,
                    title: title,
                    url: url,
                    width: width
                };
            },
            items: function(data, callback) {
                if (!isClipView) {
                    // fixme: this will have to be updated
                    callback({data: {items: []}});
                    return;
                }
                var itemsQuery, query;
                if (!ui.item) {
                    itemsQuery = ui.find;
                    query = {conditions: [], operator: '&'};
                    // if the item query contains a layer condition,
                    // then this condition is added to the clip query
                    itemsQuery.conditions.forEach(function(condition) {
                        if (
                            condition.key == 'annotations'
                            || Ox.getIndexById(pandora.site.layers, condition.key) > -1
                        ) {
                            query.conditions.push(condition);
                        }
                    });
                } else {
                    itemsQuery = {
                        conditions:[{key: 'id', value: ui.item, operator: '=='}],
                        operator: '&'
                    };
                    query = {
                        conditions: ui.itemFind === '' ? [] : [{
                            key: 'annotations',
                            value: ui.itemFind,
                            operator: '='
                        }],
                        operator: '&'
                    };
                }
                pandora.api.findClips(Ox.extend(data, {
                    itemsQuery: itemsQuery,
                    query: query
                }), callback);
            },
            keys: ['annotations', 'id', 'in', 'out'].concat(
                !ui.item ? ['videoRatio'] : []
            ),
            orientation: isEmbed && !isClipView ? 'horizontal' : 'both',
            size: 128,
            sort: !ui.item ? ui.listSort : ui.itemSort,
            unique: 'id'
        })
        .addClass('OxMedia')
        .bindEvent({
            copy: function(data) {
                var items = data.ids.map(function(id) {
                    var item = !ui.item ? id.split('/')[0] : ui.item,
                        annotation = that.value(id, 'annotations')[0].id;
                    return annotation || item + '/' + that.value(id, 'in') + '-' + that.value(id, 'out');
                })
                Ox.Clipboard.copy(items, 'clip');
            },
            copyadd: function(data) {
                var items = data.ids.map(function(id) {
                    var item = !ui.item ? id.split('/')[0] : ui.item,
                        annotation = that.value(id, 'annotations')[0].id;
                    return annotation || item + '/' + that.value(id, 'in') + '-' + that.value(id, 'out');
                })
                Ox.Clipboard.add(items, 'clip');
            },
            gainfocus: function() {
                pandora.$ui.mainMenu.replaceItemMenu();
            },
            init: function(data) {
                if (!ui.item && ui.listView == 'clip'/* && pandora.$ui.statusbar*/) {
                    pandora.$ui.statusbar.set('total', data);
                }
            },
            open: function(data) {
                var id = data.ids[0],
                    item = !ui.item ? id.split('/')[0] : ui.item,
                    annotation = that.value(id, 'annotations')[0].id,
                    points = {
                        annotation: annotation ? annotation.split('/')[1] : '',
                        'in': that.value(id, 'in'),
                        out: that.value(id, 'out'),
                        position: that.value(id, 'in')
                    },
                    set;
                if (isEmbed) {
                    window.open( '/' + item + '/'
                        + (annotation ? points.annotation : points['in'] + ',' + points.out),
                        '_blank');
                } else {
                    set = {
                        item: item,
                        itemView: pandora.user.ui.videoView
                    };
                    set['videoPoints.' + item] = Ox.extend(points, {
                        position: points['in']
                    });
                    if (['accessed', 'timesaccessed'].indexOf(ui.listSort[0].key) > -1) {
                        Ox.Request.clearCache('find');
                    }
                    pandora.UI.set(set);
                }
            },
            openpreview: function(data) {
                // on press space key
                if (data.ids.length == 1) {
                    var $video = that.find('.OxItem.OxSelected > .OxIcon > .OxVideoPlayer');
                    if ($video) {
                        // trigger singleclick
                        $video.trigger('mousedown');
                        Ox.UI.$window.trigger('mouseup');
                    }
                }
                that.closePreview();
            },
            select: function(data) {
                if (data.ids.length == 1) {
                    var id = data.ids[0],
                        item = id.split('/')[0], width, height,
                        $img = that.find('.OxItem.OxSelected > .OxIcon > img'),
                        $video = that.find('.OxItem.OxSelected > .OxIcon > .OxVideoPlayer'),
                        size = 128, ratio, width, height;
                    if ($img.length) {
                        if (!ui.item) {
                            ratio = that.value(id, 'videoRatio');
                            width = ratio > fixedRatio ? size : Math.round(size * ratio / fixedRatio);
                            height = Math.round(width / ratio);
                        } else {
                            width = fixedRatio > 1 ? size : Math.round(size * fixedRatio);
                            height = fixedRatio > 1 ? Math.round(size / fixedRatio) : size;
                        }
                        pandora.api.get({id: item, keys: ['durations', 'rightslevel']}, function(result) {
                            var points = [that.value(id, 'in'), that.value(id, 'out')],
                                $player = Ox.VideoPlayer({
                                    censored: pandora.site.capabilities.canPlayClips[pandora.user.level] < result.data.rightslevel
                                        ? [{'in': 0, out: points[1] - points[0]}]
                                        : [],
                                    censoredIcon: pandora.site.cantPlay.icon,
                                    censoredTooltip: pandora.site.cantPlay.text,
                                    height: height,
                                    paused: true,
                                    poster: '/' + item + '/' + height + 'p' + points[0] + '.jpg',
                                    rewind: true,
                                    video: pandora.getClipVideos({
                                        item: item,
                                        parts: result.data.durations.length,
                                        durations: result.data.durations,
                                        'in': points[0],
                                        out: points[1]
                                    }, Ox.min(pandora.site.video.resolutions)),
                                    width: width
                                })
                                .addClass('OxTarget')
                                .bindEvent({
                                    censored: function() {
                                        pandora.URL.push(pandora.site.cantPlay.link);
                                    },
                                    // doubleclick opens item
                                    singleclick: function(e) {
                                        if (
                                            $player.$element.is('.OxSelectedVideo')
                                            && !$(e.target).is('.OxCensoredIcon')
                                        ) {
                                            $player.togglePaused();
                                        }
                                    }
                                });
                            $img.replaceWith($player.$element);
                            $('.OxSelectedVideo').removeClass('OxSelectedVideo');
                            $player.$element.addClass('OxSelectedVideo');
                        });
                    } else if ($video.length) {
                        // item select fires before video click
                        // so we have to make sure that selecting
                        // an item that already has a video
                        // doesn't click through to play
                        ///*
                        setTimeout(function() {
                            $('.OxSelectedVideo').removeClass('OxSelectedVideo');
                            $video.addClass('OxSelectedVideo');
                        }, 300);
                        //*/
                    }
                    !ui.item && pandora.UI.set({listSelection: [item]});
                    !isEmbed && pandora.$ui.mainMenu.enableItem('findsimilar');
                } else {
                    $('.OxSelectedVideo').removeClass('OxSelectedVideo');
                    !ui.item && pandora.UI.set({listSelection: []});
                    !isEmbed && pandora.$ui.mainMenu.disableItem('findsimilar');
                }
                pandora.$ui.mainMenu.replaceItemMenu();
            },
            pandora_itemsort: function(data) {
                that.options({sort: data.value});
            },
            pandora_listsort: function(data) {
                that.options({sort: data.value});
            }
        });

    pandora.enableDragAndDrop(that, true, 'edits');
    return that;

}
