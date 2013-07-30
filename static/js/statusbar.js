// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.statusbar = function() {

    var $text = {
            titleTotal: Ox.Element('<span>').html(Ox._('Total: ')),
            total: Ox.Element('<span>'),
            titleSelected: Ox.Element('<span>').html(' &mdash; ' + Ox._('Selected: ')),
            selected: Ox.Element('<span>'),
            loading: Ox.Element('<span>').html(Ox._('Loading...'))
        },

        that = Ox.Bar({size: 16})
            .css({
                textAlign: 'center'
            })
            .append(
                Ox.Element()
                    .css({
                        marginTop: '2px',
                        fontSize: '9px'
                    })
                    .append($text.loading)
                    .append($text.titleTotal)
                    .append($text.total)
                    .append($text.titleSelected)
                    .append($text.selected)
            );

    function setTotal() {
        pandora.api.find({
            query: pandora.user.ui.find,
            sort: pandora.user.ui.listSort
        }, function(result) {
            that.set('selected', {items: 0});
            that.set('total', result.data);
        });
    }

    that.set = function(key, data) {
        if (key == 'loading') {
            Ox.forEach($text, function($element, key) {
                $element[key == 'loading' ? 'show' : 'hide']();
            });
        } else {
            $text.loading.hide();
            if (key == 'selected') {
                if (data.items == 0) {
                    $text.titleTotal.hide();
                    $text.titleSelected.hide();
                    $text.selected.hide();
                } else {
                    $text.titleTotal.show();
                    $text.titleSelected.show();
                    $text.selected.html(pandora.getStatusText(data)).show();
                }
            } else {
                $text.total.html(pandora.getStatusText(data)).show();
            }
        }
    };

    that.bindEvent({
        pandora_find: function() {
            that.set('loading');
            if (['map', 'calendar'].indexOf(pandora.user.ui.listView) > -1) {
                setTotal();
            }
        },
        pandora_listview: function(data) {
            var isNavigationView = ['map', 'calendar'].indexOf(data.value) > -1,
                wasNavigationView = ['map', 'calendar'].indexOf(data.previousValue) > -1;
            that.set('loading');
            if (isNavigationView && !wasNavigationView) {
                setTotal();
            }
        }
    });

    that.set('loading');
    if (['map', 'calendar'].indexOf(pandora.user.ui.listView) > -1) {
        setTotal();
    }

    return that;

};

