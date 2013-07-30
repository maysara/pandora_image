// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.tv = function() {

    var that = Ox.Element()
            .addClass('OxScreen')
            .css({
                position: 'absolute',
                width: '100%',
                height: '100%',
                opacity: 0,
                zIndex: 1000
            }),
        $player,
        list = pandora.user.ui.part.tv,
        lists = [],
        muted;

    function getList(direction) {
        lists.length == 0 && getLists();
        var index = lists.indexOf(list);
        return lists[
            direction == -1
            ? (index == 0 ? lists.length - 1 : index - 1)
            : (index == lists.length - 1 ? 0 : index + 1)
        ];
    }

    function getLists() {
        var menu = pandora.$ui.mainMenu.options('menus')[2];
        lists = [''];
        Ox.loop(3, function(f) {
            menu.items[f + 1].items.forEach(function(l) {
                lists.push(l.id.slice(8));
            });
        });
    }

    function play() {
        var $loading = $('<img>')
                .attr({src: Ox.UI.getImageURL('symbolLoadingAnimated')})
                .css({
                    position: 'absolute',
                    left: 0, top: 0, right: 0, bottom: 0,
                    width: '32px', height: '32px',
                    margin: 'auto'
                })
                .appendTo(that);
        pandora.api.tv({
            list: list
        }, function(result) {
            var videoOptions = pandora.getVideoOptions(result.data);
            $loading.remove();
            $player && $player.remove();
            $player = Ox.VideoPlayer({
                    censored: videoOptions.censored,
                    censoredIcon: pandora.site.cantPlay.icon,
                    controlsBottom: [
                        'zapPrevious', 'zapHome', 'zapNext',
                        'volume', 'scale', 'timeline', 'position', 'settings'
                    ],
                    controlsTooltips: {
                        open: Ox._('Open in {0} View', [Ox._(Ox.getObjectById(
                            pandora.site.itemViews, pandora.user.ui.videoView
                        ).title)])
                    },
                    controlsTop: ['close', 'title', 'open'],
                    duration: result.data.duration,
                    enableSubtitles: pandora.user.ui.videoSubtitles,
                    fullscreen: true,
                    logo: pandora.site.tv.showLogo ? '/static/png/logo.png' : '',
                    muted: muted || pandora.user.ui.videoMuted,
                    position: result.data.position,
                    resolution: pandora.user.ui.videoResolution,
                    scaleToFill: pandora.user.ui.videoScale == 'fill',
                    subtitles: videoOptions.subtitles,
                    tooltips: true,
                    timeline: '/' + result.data.item + '/timeline16p.jpg',
                    title: pandora.site.site.name + ' &mdash; ' + (
                            list || Ox._('All {0}', [Ox._(pandora.site.itemName.plural)])
                        ) + ' &mdash; '
                        + result.data.title
                        + (
                            result.data.director
                            ? ' (' + result.data.director.join(', ') + ') '
                            : ''
                        ) + result.data.year,
                    video: videoOptions.video,
                    volume: pandora.user.ui.videoVolume
                })
                .bindEvent({
                    close: that.fadeOutScreen,
                    ended: play,
                    muted: function(data) {
                        !muted && pandora.UI.set({videoMuted: data.muted});
                    },
                    open: function() {
                        var item = result.data.item,
                            position = $player.options('position'),
                            set = {
                                item: item,
                                itemView: pandora.user.ui.videoView,
                                page: ''
                            };
                        if (pandora.user.ui.videoPoints[item]) {
                            set['videoPoints.' + item + '.position'] = position;
                        } else {
                            set['videoPoints.' + item] = {
                                'in': 0, out: 0, position: position
                            };
                        }
                        pandora.UI.set(set);
                    },
                    resolution: function(data) {
                        pandora.UI.set({videoResolution: data.resolution});
                    },
                    scale: function(data) {
                        pandora.UI.set({videoScale: data.scale});
                    },
                    subtitles: function(data) {
                        pandora.UI.set({videoSubtitles: data.subtitles});
                    },
                    volume: function(data) {
                        pandora.UI.set({videoVolume: data.volume});
                    },
                    zap: function(data) {
                        if (!(data.direction == 0 && list == '')) {
                            list = data.direction == 0 ? '' : getList(data.direction);
                            play();
                        }
                    },
                    key_enter: function() {
                        $player.triggerEvent('open');
                    },
                    key_escape: function() {
                        $player.triggerEvent('close');
                    },
                    key_left: function() {
                        $player.triggerEvent('zap', {direction: -1});
                    },
                    key_right: function() {
                        $player.triggerEvent('zap', {direction: 1});
                    },
                    key_up: function() {
                        $player.triggerEvent('zap', {direction: 0});
                    }
                })
                .appendTo(that);
        });
    }

    that.fadeInScreen = function() {
        that.appendTo(Ox.UI.$body).animate({opacity: 1}, 500);
        play();
        return that;
    };

    that.fadeOutScreen = function() {
        that.animate({opacity: 0}, 500, function() {
            that.remove();
        });
        pandora.UI.set({page: ''});
        return that;
    };

    that.hideScreen = function() {
        that.remove();
        pandora.UI.set({page: ''});
        return that;
    };

    that.mute = function() {
        muted = true;
        $player && $player.options({muted: muted});
    };

    that.showScreen = function() {
        that.css({opacity: 1}).appendTo(Ox.UI.$body);
        play();
        return that;
    };

    that.unmute = function() {
        $player && $player.options({muted: pandora.user.ui.videoMuted});
        muted = false;
    };

    return that;

}
