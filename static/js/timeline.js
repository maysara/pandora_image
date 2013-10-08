// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.timeline = function(data) {

    var ui = pandora.user.ui,

        that = Ox.VideoTimelinePanel({
            annotationsCalendarSize: ui.annotationsCalendarSize,
            annotationsFont: ui.annotationsFont,
            annotationsMapSize: ui.annotationsMapSize,
            annotationsRange: ui.annotationsRange,
            annotationsSize: ui.annotationsSize,
            annotationsSort: ui.annotationsSort,
            annotationsTooltip: 'annotations <span class="OxBright">' + Ox.SYMBOLS.SHIFT + 'A</span>',
            censored: data.censored,
            censoredIcon: pandora.site.cantPlay.icon,
            censoredTooltip: pandora.site.cantPlay.text,
            clickLink: pandora.clickLink,
            cuts: data.cuts || [],
            duration: data.duration,
            followPlayer: ui.followPlayer,
            getFrameURL: function(position) {
                return '/' + ui.item + '/' + ui.videoResolution + 'p' + position + '.jpg';
            },
            getLargeTimelineURL: function(type, i) {
                return '/' + ui.item + '/timeline' + type + '64p' + i + '.jpg';
            },
            height: pandora.$ui.contentPanel.size(1),
            layers: data.annotations,
            muted: ui.videoMuted,
            position: ui.videoPoints[ui.item].position,
            resolution: Ox.min(pandora.site.video.resolutions),
            selected: ui.videoPoints[ui.item].annotation
                ? ui.item + '/' + ui.videoPoints[ui.item].annotation
                : '',
            showAnnotations: ui.showAnnotations,
            showAnnotationsCalendar: ui.showAnnotationsCalendar,
            showAnnotationsMap: ui.showAnnotationsMap,
            showLayers: Ox.clone(ui.showLayers),
            showUsers: pandora.site.annotations.showUsers,
            smallTimelineURL: '/' + ui.item + '/timeline16p.jpg',
            timeline: ui.videoTimeline,
            timelines: pandora.site.timelines,
            video: data.video,
            videoRatio: data.videoRatio,
            volume: ui.videoVolume,
            width: pandora.$ui.document.width() - pandora.$ui.mainPanel.size(0) - 1
        })
        .bindEvent({
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
            follow: function(data) {
                pandora.UI.set({followPlayer: data.follow});
            },
            gainfocus: function() {
                pandora.$ui.mainMenu.replaceItemMenu();
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
                    'videoPoints.' + pandora.user.ui.item + '.position',
                    data.position
                );
            },
            position: function(data) {
                pandora.UI.set(
                    'videoPoints.' + pandora.user.ui.item + '.position',
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
            select: function(data) {
                pandora.UI.set('videoPoints.' + pandora.user.ui.item + '.annotation', data.id.split('/')[1]);
            },
            timeline: function(data) {
                pandora.UI.set({videoTimeline: data.timeline});
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
            pandora_showannotations: function(data) {
                that.options({showAnnotations: data.value});
            },
            pandora_videotimeline: function(data) {
                that.options({timeline: data.value});
            }
        });

    return that;

};
