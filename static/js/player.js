// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.player = function(data) {

    var ui = pandora.user.ui,

        that = Ox.VideoPanel({
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
            enableSubtitles: ui.videoSubtitles,
            find: ui.itemFind,
            getLargeTimelineURL: function(type, i) {
                return '/' + ui.item + '/timeline' + type + '64p' + i + '.jpg';
            },
            height: pandora.$ui.contentPanel.size(1),
            'in': ui.videoPoints[ui.item]['in'],
            layers: data.annotations,
            loop: ui.videoLoop,
            muted: ui.videoMuted,
            out: ui.videoPoints[ui.item].out,
            position: ui.videoPoints[ui.item].position,
            resolution: ui.videoResolution,
            scaleToFill: ui.videoScale == 'fill',
            selected: ui.videoPoints[ui.item].annotation
                ? ui.item + '/' + ui.videoPoints[ui.item].annotation
                : '',
            showAnnotations: ui.showAnnotations,
            showAnnotationsCalendar: ui.showAnnotationsCalendar,
            showAnnotationsMap: ui.showAnnotationsMap,
            showLayers: Ox.clone(ui.showLayers),
            showUsers: pandora.site.annotations.showUsers,
            showTimeline: ui.showTimeline,
            smallTimelineURL: '/' + ui.item + '/timeline16p.jpg',
            subtitles: data.subtitles,
            timeline: ui.videoTimeline,
            timelineTooltip: 'timeline <span class="OxBright">' + Ox.SYMBOLS.SHIFT + 'T</span>',
            video: data.video,
            volume: ui.videoVolume,
            width: pandora.$ui.document.width() - pandora.$ui.mainPanel.size(0) - 1
        }).bindEvent({
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
                that.options('fullscreen') && that.options({
                    fullscreen: false
                });
                pandora.URL.push(pandora.site.cantPlay.link);
            },
            copy: function(data) {
                Ox.Clipboard.copy(data.map(function(clip) {
                    return clip.annotation || ui.item + '/' + clip['in'] + '-' + clip.out;
                }), 'clip');
            },
            copyadd: function(data) {
                Ox.Clipboard.add(data.map(function(clip) {
                    return clip.annotation || ui.item + '/' + clip['in'] + '-' + clip.out;
                }), 'clip');
            },
            downloadvideo: function(data) {
                document.location.href = '/' + ui.item + '/torrent/';
            },
            find: function(data) {
                pandora.UI.set({itemFind: data.find});
            },
            gainfocus: function() {
                pandora.$ui.mainMenu.replaceItemMenu();
            },
            info: function(data) {
                pandora.ui.annotationDialog(
                    Ox.getObjectById(pandora.site.layers, data.layer).title
                ).open();
            },
            loop: function(data) {
                pandora.UI.set({videoLoop: data.loop});
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
            resizeannotations: function(data) {
                pandora.UI.set({annotationsSize: data.annotationsSize});
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
            scale: function(data) {
                pandora.UI.set({videoScale: data.scale});
            },
            select: function(data) {
                pandora.UI.set('videoPoints.' + ui.item + '.annotation', data.id.split('/')[1]);
            },
            subtitles: function(data) {
                pandora.UI.set({videoSubtitles: data.subtitles});
            },
            toggleannotations: function(data) {
                pandora.UI.set({showAnnotations: data.showAnnotations});
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
            toggletimeline: function(data) {
                pandora.UI.set({showTimeline: data.showTimeline});
            },
            volume: function(data) {
                pandora.UI.set({videoVolume: data.volume});
            },
            pandora_showannotations: function(data) {
                that.options({showAnnotations: data.value});
            },
            pandora_showtimeline: function(data) {
                that.options({showTimeline: data.value});
            },
            pandora_videotimeline: function(data) {
                that.options({timeline: data.value});
            }
        });

    return that;
  
};
