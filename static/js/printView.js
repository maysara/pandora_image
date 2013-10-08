// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.printView = function(data) {

    var that = Ox.Element()
            .css({
                padding: '64px 128px',
                backgroundColor: 'rgb(255, 255, 255)',
                color: 'rgb(0, 0, 0)'
            }),
        $loading = Ox.LoadingScreen().appendTo(that),
        sortKey = pandora.user.ui.listSort[0].key,
        keys = Ox.unique(
            ['director', 'id', 'summary', 'title', 'year'].concat(sortKey)
        );

    Ox.$body.css({
        background: 'rgb(255, 255, 255)',
        overflow: 'auto'
    });

    pandora.api.find({
        query: pandora.user.ui.find
    }, function(result) {
        var totals = pandora.getStatusText(result.data);
        pandora.api.find({
            keys: keys,
            query: pandora.user.ui.find,
            range: [0, result.data.items],
            sort: pandora.user.ui.listSort
        }, function(result) {
            var padding;
            $loading.remove();
            $('<div>')
                .css({height: '16px'})
                .html(
                    '<b>' + pandora.site.site.name + ' - '
                    + (
                        pandora.user.ui._list
                        ? 'List ' + pandora.user.ui._list
                        : 'All ' + pandora.site.itemName.plural
                    ) + '</b>'
                )
                .appendTo(that);
            $('<div>').css({height: '16px'}).appendTo(that);
            result.data.items && result.data.items.forEach(function(item) {
                var format = Ox.clone(
                        Ox.getObjectById(pandora.site.itemKeys, sortKey).format
                    ),
                    url = (pandora.site.https ? 'https://' : 'http://')
                        + pandora.site.site.url + '/' + item.id;
                if (format && format.type == 'ColorPercent') {
                    format = {type: 'percent', args: [100, 1]};
                }
                $('<div>')
                    .attr({title: url})
                    .css({
                        height: '16px',
                        textAlign: 'justify',
                        textOverflow: 'ellipsis',
                        cursor: 'pointer',
                        overflow: 'hidden'
                    })
                    .html(
                        (item.director ? item.director.join(', ') + ' ' : '')
                        + '<b>' + item.title + '</b>'
                        + (item.year ? ' (' + item.year + ')' : '')
                        + (
                            item[sortKey] && !Ox.contains(['director', 'title', 'year'], sortKey)
                            ? ' ' + ( 
                                format && !/^color/.test(format.type)
                                ? Ox['format' + Ox.toTitleCase(format.type)].apply(
                                    this, [item[sortKey]].concat(format.args || [])
                                )
                                : item[sortKey]
                            )
                            : ''
                        )
                        + (
                            item.summary
                            ? ' <span style="color: rgb(128, 128, 128)">'
                                + Ox.encodeHTMLEntities(item.summary)
                                + '</span>'
                            : ''
                        )
                    )
                    .on({
                        click: function() {
                            document.location.href = url;
                        }
                    })
                    .appendTo(that);
            });
            if (result.data.items.length) {
                $('<div>').css({height: '16px'}).appendTo(that);
            }
            $('<div>')
                .css({height: '16px'})
                .html(
                    '<span style="color: rgb(128, 128, 128)">'
                    + totals + '</span'
                )
                .appendTo(that);
        });
    });

    that.display = function() {
        // fixme: move animation into Ox.App
        var animate = $('.OxScreen').length == 0;
        Ox.Log('', 'ANIMATE?', animate)
        animate && pandora.$ui.body.css({opacity: 0});
        that.appendTo(pandora.$ui.body);
        animate && pandora.$ui.body.animate({opacity: 1}, 1000);
        return that;
    };

    return that;

};