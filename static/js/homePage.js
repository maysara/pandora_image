// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

// FIXME: remove

pandora.ui.homePage = function() {

    var that = Ox.Element()
        .css({padding: '8px'});

    var $left = $('<div>')
            .css({
                float: 'left',
                margin: '8px',
                background: 'black'
            })
            .html('left')
            .appendTo(that.$element),
        $center = $('<div>')
            .css({
                float: 'left',
                margin: '8px'
            })
            .appendTo(that.$element),
        $right = $('<div>')
            .css({
                float: 'left',
                margin: '8px',
                background: 'black'
            })
            .html('right')
            .appendTo(that.$element),
        $logo = $('<img>')
            .attr({src: '/static/png/logo.png'})
            .appendTo($center);
        // fixme: duplicated
        $select = Ox.Select({
            id: 'select',
            items: [].concat(pandora.site.findKeys.map(function(key) {
                return {
                    id: key.id,
                    title: Ox._('Find: {0}', [Ox._(key.title)])
                };
            }), [{}, {
                id: 'advanced',
                title: Ox._('Find: Advanced')
            }]),
            overlap: 'right',
            width: 112
        })
        $input = Ox.Input({})
            .bindEvent({
                change: function() {
                    
                }
            });
        $findElement = Ox.FormElementGroup({
                elements: [$select, $input]
            })
            .css({marginTop: '16px'})
            .appendTo($center);
        $center = $('<div>')
            .css({marginTop: '16px'})
            .html('center')
            .appendTo($center);

    that.resize = function() {
        var size = Ox.splitInt(window.innerWidth - pandora.user.ui.showSidebar * pandora.user.ui.sidebarSize - 1 - 64, 3);
        $left.css({width: size[0] + 'px'});
        $center.css({width: size[1] + 'px'});
        $logo.css({width: size[1] + 'px'});
        $input.options({width: size[1] - 112});
        $right.css({width: size[2] + 'px'});
    };

    that.resize();

    return that;

}
