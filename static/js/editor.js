// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.editor = function(data) {

    var ui = pandora.user.ui,

        that = Ox.VideoEditor({
            annotationsCalendarSize: ui.annotationsCalendarSize,
            annotationsFont: ui.annotationsFont,
            annotationsMapSize: ui.annotationsMapSize,
            annotationsRange: ui.annotationsRange,
            annotationsSize: ui.annotationsSize,
            annotationsSort: ui.annotationsSort,
            annotationsTooltip: Ox._('annotations {}',
                ['<span class="OxBright">' + Ox.SYMBOLS.SHIFT + 'A</span>']),
            censored: data.censored,
            censoredIcon: pandora.site.cantPlay.icon,
            censoredTooltip: pandora.site.cantPlay.text,
            clickLink: pandora.clickLink,
            cuts: data.cuts || [],
            duration: data.duration,
            enableDownload: pandora.site.capabilities.canDownloadVideo[pandora.user.level] >= data.rightslevel,
            enableImport: pandora.site.capabilities.canImportAnnotations[pandora.user.level],
            enableSetPosterFrame: !pandora.site.media.importFrames && data.editable,
            enableSubtitles: ui.videoSubtitles,
            find: ui.itemFind,
            getFrameURL: function(position) {
                return '/' + ui.item + '/' + ui.videoResolution + 'p' + position + '.jpg?' + data.modified;
            },
            getLargeTimelineURL: function(type, i) {
                return '/' + ui.item + '/timeline' + type + '64p' + i + '.jpg?' + data.modified;
            },
            getSmallTimelineURL: function(type, i) {
                return '/' + ui.item + '/timeline' + type + '16p' + i + '.jpg?' + data.modified;
            },
            height: pandora.$ui.contentPanel.size(1),
            id: 'editor',
            'in': ui.videoPoints[ui.item]['in'],
            layers: data.annotations.map(function(layer) {
                return Ox.extend({
                    editable: layer.canAddAnnotations[pandora.user.level]
                }, layer);
            }),
            muted: ui.videoMuted,
            out: ui.videoPoints[ui.item].out,
            position: ui.videoPoints[ui.item].position,
            posterFrame: data.posterFrame,
            resolution: ui.videoResolution,
            selected: ui.videoPoints[ui.item].annotation
                ? ui.item + '/' + ui.videoPoints[ui.item].annotation
                : '',
            showAnnotations: ui.showAnnotations,
            showAnnotationsCalendar: ui.showAnnotationsCalendar,
            showAnnotationsMap: ui.showAnnotationsMap,
            showLargeTimeline: true,
            showLayers: Ox.clone(ui.showLayers),
            showUsers: pandora.site.annotations.showUsers,
            subtitles: data.subtitles,
            timeline: ui.videoTimeline,
            timelines: pandora.site.timelines,
            video: data.video,
            videoRatio: data.videoRatio,
            videoSize: ui.videoSize,
            volume: ui.videoVolume,
            width: pandora.$ui.document.width() - pandora.$ui.mainPanel.size(0) - 1
        }).bindEvent({
            addannotation: function(data) {
                Ox.Log('', 'addAnnotation', data);
                // async to not capture keyboard input
                setTimeout(function() {
                    var created = Ox.formatDate(new Date(), '%Y-%m-%dT%H:%M:%SZ'),
                        type = Ox.getObjectById(pandora.site.layers, data.layer).type;
                    that.addAnnotation(data.layer, Ox.extend(
                        {
                            created: created,
                            duration: data.out - data['in'],
                            editable: true,
                            id: '_' + Ox.uid(),
                            'in': data['in'],
                            modified: created,
                            out: data.out,
                            user: pandora.user.username,
                            value: ''
                        },
                        type == 'place' ? {
                            place: {lat: null, lng: null}
                        } : type == 'event' ? {
                            event: {start: '', end: ''}
                        } : {}
                    ));
                    Ox.Request.clearCache();
                });
            },
            annotationsfont: function(data) {
                pandora.UI.set({annotationsFont: data.font});
            },
            annotationsrange: function(data) {
                pandora.UI.set({annotationsRange: data.range});
            },
            annotationssize: function(data) {
                pandora.UI.set({annotationsSize: data.size});
            },
            annotationssort: function(data) {
                pandora.UI.set({annotationsSort: data.sort});
            },
            censored: function() {
                pandora.URL.push(pandora.site.cantPlay.link);
            },
            copy: function(data) {
                Ox.Clipboard.copy(data.map(function(clip) {
                    return Ox.extend(clip, {item: ui.item});
                }), 'clip');
            },
            copyadd: function(data) {
                Ox.Clipboard.add(data.map(function(clip) {
                    return Ox.extend(clip, {item: ui.item});
                }), 'clip');
            },
            define: function(data) {
                var dialog = data.type + 'sDialog';
                pandora.$ui[dialog] && pandora.$ui[dialog].remove();
                pandora.$ui[dialog] = pandora.ui[dialog](data).open();
            },
            downloadvideo: function(data) {
                document.location.href = '/' + ui.item + '/torrent/';
            },
            downloadselection: function(data) {
                document.location.href = '/' + ui.item
                    + '/' + Ox.max(pandora.site.video.resolutions)
                    + 'p.webm?t=' + data['in'] + ',' + data.out;
            },
            editannotation: function(data) {
                Ox.Log('', 'editAnnotation', data);
                function callback(result) {
                    Ox.Log('', 'editAnnotation result', result);
                    result.data.date = Ox.formatDate(
                        result.data.modified.slice(0, 10), '%B %e, %Y'
                    );
                    that.updateAnnotation(data.id, result.data);
                    Ox.Request.clearCache();
                };
                if (data.id[0] == '_') {
                    pandora.api.addAnnotation({
                        'in': data['in'],
                        item: ui.item,
                        layer: data.layer,
                        out: data.out,
                        value: data.value
                    }, callback);
                } else {
                    pandora.api.editAnnotation({
                        id: data.id,
                        'in': data['in'],
                        out: data.out,
                        value: data.value
                    }, callback);
                }
            },
            embedselection: function() {
                pandora.$ui.embedVideoDialog && pandora.$ui.embedVideoDialog.remove();
                pandora.$ui.embedVideoDialog = pandora.ui.embedVideoDialog().open();
            },
            find: function(data) {
                pandora.UI.set({itemFind: data.find});
            },
            findannotations: function(data) {
                pandora.UI.set({
                    item: '',
                    find: {
                        conditions: [{key: data.key, value: data.value, operator: '='}],
                        operator: '&'
                    },
                    listView: 'clip'
                });
            },
            importannotations: function(data) {
                pandora.ui.importAnnotations().open();
            },
            info: function(data) {
                pandora.ui.annotationDialog(
                    Ox.getObjectById(pandora.site.layers, data.layer).title
                ).open();
            },
            muted: function(data) {
                pandora.UI.set({videoMuted: data.muted});
            },
            playing: function(data) {
                pandora.UI.set(
                    'videoPoints.' + ui.item + '.position',
                    data.position
                );
            },
            points: function(data) {
                pandora.UI.set('videoPoints.' + ui.item, {
                    annotation: ui.videoPoints[ui.item].annotation,
                    'in': data['in'],
                    out: data.out,
                    position: data.position
                });
            },
            position: function(data) {
                pandora.UI.set(
                    'videoPoints.' + ui.item + '.position',
                    data.position
                );
            },
            posterframe: function(data) {
                pandora.api.setPosterFrame({
                    id: ui.item,
                    position: data.position
                }, function() {
                    if (pandora.$ui.videoPreview) {
                        pandora.$ui.videoPreview.options({
                            position: data.position
                        });
                    }
                    if (ui.listSort[0].key == 'modified') {
                        Ox.Request.clearCache('find');
                        pandora.$ui.browser
                            .reloadList()
                            .bindEventOnce({
                                load: function() {
                                    updateBrowser();
                                }
                            });
                    } else {
                        updateBrowser();
                    }
                });
            },
            removeannotation: function(data) {
                pandora.UI.set('videoPoints.' + ui.item + '.annotation', null);
                pandora.api.removeAnnotation({
                    id: data.id
                }, function(result) {
                    //fixme: check for errors
                    //that.removeAnnotation(data.layer, data.id);
                    Ox.Request.clearCache();
                });
            },
            resize: function(data) {
                that.options({height: data.size});
            },
            resizecalendar: function(data) {
                pandora.UI.set({annotationsCalendarSize: data.size});
            },
            resizemap: function(data) {
                pandora.UI.set({annotationsMapSize: data.size});
            },
            resolution: function(data) {
                pandora.UI.set({videoResolution: data.resolution});
            },
            select: function(data) {
                pandora.UI.set('videoPoints.' + ui.item + '.annotation', data.id.split('/')[1]);
            },
            subtitles: function(data) {
                pandora.UI.set({videoSubtitles: data.subtitles});
            },
            timeline: function(data) {
                pandora.UI.set({videoTimeline: data.timeline});
            },
            toggleannotations: function(data) {
                pandora.UI.set({showAnnotations: data.showAnnotations});
            },
            togglecalendar: function(data) {
                pandora.UI.set({showAnnotationsCalendar: !data.collapsed});
            },
            togglelayer: function(data) {
                pandora.UI.set('showLayers.' + data.layer, !data.collapsed);
            },
            togglemap: function(data) {
                pandora.UI.set({showAnnotationsMap: !data.collapsed});
            },
            togglesize: function(data) {
                pandora.UI.set({videoSize: data.size});
            },
            pandora_showannotations: function(data) {
                that.options({showAnnotations: data.value});
            },
            pandora_videotimeline: function(data) {
                that.options({timeline: data.value});
            }
        });

    function updateBrowser() {
        pandora.$ui.browser.find('img[src*="/' + ui.item + '/"]').each(function() {
            $(this).attr({
                src: '/' + ui.item + '/' + (
                    ui.icons == 'posters' ? 'poster' : 'icon'
                ) + '128.jpg?' + Ox.uid()
            });
        });
    }

    return that;

};
