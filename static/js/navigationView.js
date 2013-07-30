// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.navigationView = function(type, videoRatio) {

    var ui = pandora.user.ui,
        isEmbed = pandora.isEmbedURL(),
        itemName = type == 'map' ? 'place' : 'event',
        listSizes = [
            144 + Ox.UI.SCROLLBAR_SIZE,
            280 + Ox.UI.SCROLLBAR_SIZE,
            416 + Ox.UI.SCROLLBAR_SIZE
        ],
        listSize = listSizes[ui.clipColumns - 1],

        $element = Ox.Element(),

        $toolbar = Ox.Bar({size: 24})
            .append(
                pandora.$ui.sortElement = pandora.ui.sortElement(true)
            )
            .bindEvent({
                doubleclick: function(e) {
                    if ($(e.target).is('.OxBar')) {
                        $list.animate({scrollTop: 0}, 250);
                    }
                }
            }),

        $list = pandora.ui.clipList(videoRatio)
            .bindEvent({
                init: function(data) {
                    updateStatusbar(data.items);
                }
            }),

        $status = $('<div>')
            .css({
                width: '100%',
                marginTop: '2px',
                fontSize: '9px',
                textAlign: 'center',
                textOverflow: 'ellipsis'
            }),

        $statusbar = Ox.Bar({size: 16}).append($status),

        $listPanel = Ox.SplitPanel({
            elements: [
                {
                    element: $toolbar,
                    size: 24
                },
                {
                    element: $list
                },
                {
                    element: $statusbar,
                    size: 16
                }
            ],
            orientation: 'vertical'
        })
        .bindEvent({
            resize: function() {
                $list.size()
            },
            resizeend: function(data) {
                var size = data.size;
                if (listSizes.indexOf(size) == -1) {
                    if (size <= (listSizes[0] + listSizes[1]) / 2) {
                        size = listSizes[0];
                    } else if (size < (listSizes[1] + listSizes[2]) / 2) {
                        size = listSizes[1];
                    } else {
                        size = listSizes[2];
                    }
                    that.size(1, size, function() {
                        // strangely, the animation may still not be fully
                        // finished, causing the list size to be off by one
                        setTimeout(function() {
                            $element['resize' + Ox.toTitleCase(type)]();
                            $list.size();
                        }, 0);
                    });
                }
                pandora.UI.set({clipColumns: listSizes.indexOf(size) + 1});
            }
        }),

        that = !isEmbed ? Ox.SplitPanel({
            elements: [
                {
                    element: $element
                },
                {
                    element: $listPanel,
                    resizable: true,
                    resize: listSizes,
                    size: listSize,
                    tooltip: Ox._('clips')
                }
            ],
            orientation: 'horizontal'
        }) : Ox.SplitPanel({
            elements: [
                {
                    element: $element
                },
                {
                    element: $listPanel,
                    size: 188 + Ox.UI.SCROLLBAR_SIZE
                }
            ],
            orientation: 'vertical'
        });

    if (type == 'map') {

        that.replaceElement(0,
            $element = Ox.Map({
                // clickable: pandora.site.capabilities.canClickMap[pandora.user.level],
                find: ui.mapFind,
                // 20 px menu + 24 px toolbar + 1px resizbar + 16px statusbar (if !item)
                height: isEmbed ? window.innerHeight - 40
                    : !ui.item ? window.innerHeight - ui.showFilters * ui.filtersSize - 61
                    : window.innerHeight - ui.showBrowser * (112 + Ox.UI.SCROLLBAR_SIZE) - 45,
                places: function(data, callback) {
                    var itemsQuery;
                    if (!ui.item) {
                        itemsQuery = ui.find;
                    } else {
                        itemsQuery = {
                            conditions: [{key: 'id', value: ui.item, operator: '=='}],
                            operator: '&'
                        };
                    }
                    return pandora.api.findPlaces(Ox.extend({
                        itemsQuery: itemsQuery
                    }, data), callback);
                },
                selected: ui.mapSelection,
                showControls: ui.showMapControls,
                showLabels: ui.showMapLabels,
                showTypes: true,
                toolbar: true,
                width: isEmbed ? window.innerWidth
                    : window.innerWidth - ui.showSidebar * ui.sidebarSize - listSize - 2,
                zoombar: true
            })
            .bindEvent({
                resize: function() {
                    $element.resizeMap();
                },
                selectplace: selectItem,
                togglecontrols: function(data) {
                    pandora.UI.set({showMapControls: data.visible});
                },
                togglelabels: function(data) {
                    pandora.UI.set({showMapLabels: data.visible});
                }
            })
        );
        // needed for resize handlers further up
        pandora.$ui.map = $element;

    } else {

        pandora.api.findEvents({
            itemsQuery: !ui.item ? ui.find : {
                conditions: [{key: 'id', value: ui.item, operator: '=='}],
                operator: '&'
            },
            keys: ['id', 'name', 'start', 'end'],
            query: {
                conditions: [{key: 'start', value: '', operator: '!='}]
            },
            range: [0, 1000000]
        }, function(result) {
            that.replaceElement(0,
                $element = Ox.Calendar({
                    date: new Date(ui.calendarFind || 0),
                    events: result.data.items,
                    // 20 px menu + 24 px toolbar + 1px resizbar + 16px statusbar (if !item)
                    height: !ui.item
                        ? window.innerHeight - ui.showFilters * ui.filtersSize - 61
                        : window.innerHeight - ui.showBrowser * (112 + Ox.UI.SCROLLBAR_SIZE) - 45,
                    range: [-5000, 5000],
                    selected: ui.calendarSelection,
                    showControls: ui.showCalendarControls,
                    showToolbar: true,
                    showZoombar: true,
                    width: window.innerWidth - ui.showSidebar * ui.sidebarSize - listSize - 2,
                    zoom: 4
                })
                .bindEvent({
                    resize: function(data) {
                        // triggered by SplitPanel
                        $element.resizeCalendar();
                    },
                    select: selectItem
                })
            );
            // needed for resize handlers further up
            pandora.$ui.calendar = $element;
        });

    }

    updateStatusbar();

    function selectItem(data) {
        var id = data.id || '';
        if (id && id[0] != '_') {
            $status.html(Ox._('Loading...'));
            $list.options({
                items: function(data, callback) {
                    var itemsQuery;
                    if (!ui.item) {
                        itemsQuery = ui.find;
                    } else {
                        itemsQuery = {
                            conditions: [{key: 'id', value: ui.item, operator: '=='}],
                            operator: '&'
                        };
                    }
                    return pandora.api.findClips(Ox.extend(data, {
                        itemsQuery: itemsQuery,
                        query: {
                            conditions: [{key: itemName, value: id, operator:'=='}],
                            operator: '&'
                        }
                    }), callback);
                }
            });
            type == 'map' && pandora.UI.set({mapSelection: data.name});
        } else {
            $list.options({
                items: function(data, callback) {
                    callback({data: {items: data.keys ? [] : 0}});
                }
            });
            type == 'map' && pandora.UI.set({mapSelection: id ? $element.options('find') : ''});
        }
    }

    function updateStatusbar(items) {
        $status.html(Ox.toTitleCase(Ox.formatCount(items, 'clip')));
    }

    // needed to it can recieve events from UI module
    pandora.$ui.clipList = $list;

    return that;

};
