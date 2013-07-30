// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.videoView = function(isEmbed) {
    var ui = pandora.user.ui,
        itemsQuery,
        query,
        that = Ox.Element().css({
            width: '100%',
            hegiht: '100%',
        }).update({
            sort: function() {
                //fixme just update player items
                loadPlayer();
            }
        }),
        range = [0, 500],
        clips = [],
        player;

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
    loadPlayer();
    function loadPlayer() {
        pandora.api.findClips({
            query: query,
            itemsQuery: itemsQuery,
            keys: ['id', 'in', 'out', 'durations', 'parts'],
            range: range,
            sort: pandora.user.ui.listSort
        }, function(result) {
            pandora.$ui.statusbar && pandora.$ui.statusbar.set('total', {
                items: result.data.items.length
            });
            player && player.remove();
            player = Ox.VideoPlayer({
                controlsBottom: ['play', 'previous', 'next', 'volume'],
                controlsTop: (isEmbed ? [] : ['fullscreen']).concat(['scale']),
                enableMouse: true,
                height: getHeight(),
                paused: true,
                position: 0,
                video: Ox.flatten(result.data.items.map(function(clip) {
                    clip.item = clip.id.split('/')[0];
                    return pandora.getClipVideos(clip);
                })),
                width: getWidth()
            }).appendTo(that);
        });
    }

    function getHeight() {
        return isEmbed
            ? window.innerHeight
            : that.height();
    }

    function getWidth() {
        return isEmbed
            ? window.innerWidth
            : that.width();
    }

    that.reloadList = function() {
        loadPlayer();
    };
    that.size = function() {
        player && player.options({
            height: getHeight(),
            width: getWidth(),
        })
    }

    return that;
};
