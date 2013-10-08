'use strict';

pandora.ui.editPanel = function() {

    var ui = pandora.user.ui,
        edit,
        listSizes = [
            144 + Ox.UI.SCROLLBAR_SIZE,
            280 + Ox.UI.SCROLLBAR_SIZE,
            416 + Ox.UI.SCROLLBAR_SIZE
        ],
        listSize = listSizes[ui.clipColumns],
        smallTimelineCanvas,
        smallTimelineContext,
        that = Ox.Element();

    ui.edit ? renderEdit() : renderEdits();

    function editPointsKey(key) {
        return 'editPoints.' + ui.edit.replace(/\./g, '\\.') + '.' + key;
    }

    function enableDragAndDrop() {
        pandora.enableDragAndDrop(
            Ox.UI.elements[that.find('.OxIconList').data('oxid')],
            edit.editable
        );
    }

    function getSmallTimelineURL() {
        var fps = 25,
            width = Math.floor(edit.duration * fps),
            height = 64;
        smallTimelineCanvas = Ox.$('<canvas>').attr({width: width, height: height})[0];
        smallTimelineContext = smallTimelineCanvas.getContext('2d');
        return smallTimelineCanvas.toDataURL();
    }

    function getVideos() {
        var videos = {};
        pandora.site.video.resolutions.forEach(function(resolution) {
            videos[resolution] = Ox.flatten(edit.clips.map(function(clip) {
                return pandora.getClipVideos(clip, resolution);
            }));
        });
        return videos;
    }

    function renderEdit() {
        pandora.api.getEdit({id: ui.edit}, function(result) {
            edit = result.data;
            // fixme: duration should come from backend
            edit.duration = 0;
            edit.clips.forEach(function(clip) {
                clip.position = edit.duration;
                edit.duration += clip.duration;
            });
            updateSmallTimelineURL();
            pandora.$ui.mainPanel.replaceElement(1,
                that = pandora.$ui.editPanel = Ox.VideoEditPanel({
                    clips: Ox.clone(edit.clips),
                    clipSize: listSize,
                    clipSort: ui.clipSort,
                    clipSortOptions: [/*...*/],
                    clipView: ui.clipView,
                    duration: edit.duration,
                    editable: edit.editable,
                    enableSubtitles: ui.videoSubtitles,
                    fullscreen: false,
                    getClipImageURL: function(id, width, height) {
                        var clip = Ox.getObjectById(edit.clips, id);
                        return '/' + clip.item + '/' + height + 'p' + clip['in'] + '.jpg';
                    },
                    getLargeTimelineURL: function(type, i, callback) {
                        pandora.getLargeEditTimelineURL(edit, type, i, callback);
                    },
                    height: pandora.$ui.appPanel.size(1),
                    'in': ui.editPoints[ui.edit]['in'],
                    loop: ui.videoLoop,
                    muted: ui.videoMuted,
                    out: ui.editPoints[ui.edit].out,
                    position: ui.editPoints[ui.edit].position,
                    resolution: ui.videoResolution,
                    scaleToFill: ui.videoScale == 'fill',
                    // selected: ...
                    showClips: ui.showClips,
                    showTimeline: ui.showTimeline,
                    smallTimelineURL: getSmallTimelineURL(),
                    sort: ui.clipSort,
                    sortOptions: [
                            {id: 'index', title: Ox._('Sort Manually'), operator: '+'}
                        ].concat(
                            pandora.site.clipKeys.map(function(key) {
                                return Ox.extend(Ox.clone(key), {
                                    title: Ox._(('Sort by Clip {0}'), [Ox._(key.title)])
                                });
                            })
                        ).concat(
                            pandora.site.sortKeys.map(function(key) {
                                return Ox.extend(Ox.clone(key), {
                                    title: Ox._('Sort by {0}', [Ox._(key.title)])
                                });
                            })
                        ),
                    timeline: ui.videoTimeline,
                    video: getVideos(),
                    volume: ui.videoVolume,
                    width: pandora.$ui.document.width() - pandora.$ui.mainPanel.size(0) - 1
                })
                .bindEvent({
                    copy: function(data) {
                        Ox.Clipboard.copy(data.ids.map(function(id) {
                            var clip = Ox.getObjectById(edit.clips, id);
                            return clip.annotation || clip.item + '/' + clip['in'] + '-' + clip.out;
                        }), 'clip');
                    },
                    copyadd: function(data) {
                        Ox.Clipboard.add(data.ids.map(function(id) {
                            var clip = Ox.getObjectById(edit.clips, id);
                            return clip.annotation || clip.item + '/' + clip['in'] + '-' + clip.out;
                        }), 'clip');
                    },
                    edit: function(data) {
                        var args = {id: data.id},
                            index = Ox.getIndexById(edit.clips, data.id),
                            clip = edit.clips[index];
                        if (data.key == 'duration') {
                            data.key = 'out';
                            data.value += clip['in'];
                        }
                        pandora.api.get({id: clip.item, keys: ['duration']}, function(result) {
                            data.value = Math.min(data.value, result.data.duration);
                            args[data.key] = data.value;
                            if (data.key == 'in' && data.value > clip.out) {
                                args.out = args['in'];
                            } else if (data.key == 'out' && data.value < clip['in']) {
                                args['in'] = args.out;
                            }
                            pandora.api.editClip(args, function(result) {
                                if (result.status.code == 200) {
                                    edit.clips[index] = result.data;
                                    that.updateClip(data.id, result.data);
                                    updateVideos();
                                } else {
                                    Ox.print('failed to edit clip', result);
                                }
                            });
                        });
                    },
                    loop: function(data) {
                        pandora.UI.set({videoLoop: data.loop});
                    },
                    move: function(data) {
                        pandora.api.orderClips({
                            edit: edit.id,
                            ids: data.ids
                        }, function(result) {
                            Ox.Request.clearCache('getEdit');
                            orderClips(data.ids);
                        });
                    },
                    muted: function(data) {
                        pandora.UI.set({videoMuted: data.muted});
                    },
                    open: function(data) {
                        pandora.UI.set(editPointsKey('clip'), data.ids[0]);
                    },
                    paste: function() {
                        if (Ox.Clipboard.type() == 'clip') {
                            pandora.api.addClips({
                                clips: Ox.Clipboard.paste().map(function(clip) {
                                    var split = clip.split('/'),
                                        item = split[0],
                                        points = split[1].split('-');
                                    return Ox.extend({
                                        item: item
                                    }, points.length == 1 ? {
                                        annotation: clip
                                    } : {
                                        'in': parseFloat(points[0]),
                                        out: parseFloat(points[1])
                                    });
                                }),
                                edit: ui.edit
                            }, function(result) {
                                Ox.Request.clearCache('getEdit');
                                updateClips(edit.clips.concat(result.data.clips));
                            });
                        }
                    },
                    playing: function(data) {
                        var set = {};
                        set[editPointsKey('clip')] = '';
                        set[editPointsKey('position')] = data.position;
                        pandora.UI.set(set);
                    },
                    position: function(data) {
                        var set = {};
                        set[editPointsKey('clip')] = '';
                        set[editPointsKey('position')] = data.position;
                        pandora.UI.set(set);
                    },
                    remove: function(data) {
                        if (edit.editable) {
                            pandora.api.removeClips({
                                ids: data.ids,
                                edit: ui.edit
                            }, function(result) {
                                Ox.Request.clearCache('getEdit');
                                updateClips(result.data.clips);
                            });
                        }
                    },
                    resize: function(data) {
                        // sidebar resize
                        that.options({width: data.size});
                    },
                    resizeclips: function(data) {
                        pandora.UI.set({clipsSize: data.clipsSize});
                    },
                    resolution: function(data) {
                        pandora.UI.set({videoResolution: data.resolution});
                    },
                    scale: function(data) {
                        pandora.UI.set({videoScale: data.scale});
                    },
                    size: function(data) {
                        pandora.UI.set({clipSize: data.size});
                    },
                    sort: function(data) {
                        pandora.UI.set({clipSort: data});
                        var key = data[0].key;
                        if (key == 'position') {
                            key = 'in';
                        }
                        if ([
                            'id', 'index', 'in', 'out', 'duration',
                            'title', 'director', 'year', 'videoRatio'
                        ].indexOf(key) > -1) {
                            edit.clips = Ox.sortBy(edit.clips, key);
                            if (data[0].operator == '-') {
                                edit.clips.reverse();
                            }
                            updateClips(edit.clips);
                        } else {
                            pandora.api.sortClips({
                                edit: edit.id,
                                sort: data
                            }, function(result) {
                                edit.clips.forEach(function(clip) {
                                    clip['sort'] = result.data.clips.indexOf(clip.id);
                                });
                                edit.clips = Ox.sortBy(edit.clips, 'sort');
                                updateClips(edit.clips);
                            });
                        }
                    },
                    subtitles: function(data) {
                        pandora.UI.set({videoSubtitles: data.subtitles});
                    },
                    timeline: function(data) {
                        pandora.UI.set({videoTimeline: data.timeline});
                    },
                    toggleclips: function(data) {
                        pandora.UI.set({showClips: data.showClips});
                    },
                    toggletimeline: function(data) {
                        pandora.UI.set({showTimeline: data.showTimeline});
                    },
                    view: function(data) {
                        pandora.UI.set({clipView: data.view});
                        data.view == 'grid' && enableDragAndDrop();
                    },
                    volume: function(data) {
                        pandora.UI.set({videoVolume: data.volume});
                    },
                    pandora_showclips: function(data) {
                        that.options({showClips: data.value});
                    },
                    pandora_showtimeline: function(data) {
                        that.options({showTimeline: data.value});
                    },
                    pandora_videotimeline: function(data) {
                        that.options({timeline: data.value});
                    }
                })
            );
            ui.clipView == 'grid' && enableDragAndDrop();
        });
    }

    function renderEdits() {
        that = Ox.IconList({
            borderRadius: 16,
            defaultRatio: 1,
            draggable: true,
            item: function(data, sort, size) {
                size = size || 128;
                var ui = pandora.user.ui,
                    url = '/edit/' + data.id + '/icon'+size+'.jpg?' + data.modified,
                    info = Ox.formatDuration(data.duration);
                return {
                    height: size,
                    id: data.id,
                    title: data.name,
                    info: info,
                    url: url,
                    width: size,
                }
            },
            items: function(data, callback) {
                pandora.api.findEdits(data, callback);
                return Ox.clone(data, true);
            },
            keys: ['id', 'modified', 'name', 'duration'],
            size: 128,
            sort: [{key: 'id', operator: '+'}],
            unique: 'id'
        })
        .addClass('OxMedia')
        .bindEvent({
            open: function(data) {
                pandora.UI.set('edit', data.ids[0]);
            }
        });
    }

    function orderClips(ids) {
        edit.clips.forEach(function(clip) {
            clip.index = ids.indexOf(clip.id);
        });
        edit.clips = Ox.sortBy(edit.clips, 'index');
        updateVideos();
    }

    function updateClips(clips) {
        edit.clips = clips;
        edit.duration = 0;
        edit.clips.forEach(function(clip) {
            clip.position = edit.duration;
            edit.duration += clip.duration;
        });
        that.options({
            clips: Ox.clone(clips),
            smallTimelineURL: getSmallTimelineURL(),
            video: getVideos()
        });
        updateSmallTimelineURL();
    }

    function updateSmallTimelineURL() {
        var fps = 25;
        Ox.serialForEach(edit.clips, function(clip) {
            var callback = Ox.last(arguments);
            pandora.getLargeClipTimelineURL(clip.item, clip['in'], clip.out, ui.videoTimeline, function(url) {
                var image = Ox.$('<img>')
                    .on({
                        load: function() {
                            smallTimelineContext.drawImage(image, Math.floor(clip.position * fps), 0);
                            that.options({smallTimelineURL: smallTimelineCanvas.toDataURL()});
                            callback();
                        }
                    })
                    .attr({
                        src: url
                    })[0];
            });
        });
    }

    function updateVideos() {
        edit.duration = 0;
        edit.clips.forEach(function(clip) {
            clip.position = edit.duration;
            edit.duration += clip.duration;
        });
        that.options({
            smallTimelineURL: getSmallTimelineURL(),
            video: getVideos()
        });
        updateSmallTimelineURL();
    }

    return that;

};
