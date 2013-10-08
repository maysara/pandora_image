// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.browser = function() {
    var that;
    if (!pandora.user.ui.item) {
        pandora.user.ui.filterSizes = pandora.getFilterSizes();
        pandora.$ui.filters = pandora.ui.filters();
        that = Ox.SplitPanel({
            elements: [
                {
                    element: pandora.$ui.filters[0],
                    size: pandora.user.ui.filterSizes[0]
                },
                {
                    element: pandora.$ui.filtersInnerPanel = pandora.ui.filtersInnerPanel()
                },
                {
                    element: pandora.$ui.filters[4],
                    size: pandora.user.ui.filterSizes[4]
                },
            ],
            id: 'browser',
            orientation: 'horizontal'
        })
        .bindEvent({
            resize: function(data) {
                pandora.$ui.filters.forEach(function(list) {
                    list.size();
                });
                if (pandora.user.ui.listView == 'map') {
                    pandora.$ui.map.resizeMap();
                } else if (pandora.user.ui.listView == 'calendar') {
                    pandora.$ui.calendar.resizeCalendar();
                } else if (pandora.user.ui.listView == 'video') {
                    pandora.$ui.list.size();
                }
            },
            resizeend: function(data) {
                pandora.UI.set({filtersSize: data.size});
            },
            toggle: function(data) {
                data.collapsed && pandora.$ui.list.gainFocus();
                pandora.UI.set({showFilters: !data.collapsed});
                if (!data.collapsed) {
                    pandora.$ui.filters.forEach(function($filter) {
                        var selected = $filter.options('_selected');
                        if (selected) {
                            $filter.bindEventOnce({
                                load: function() {
                                    $filter.options({
                                        _selected: false,
                                        selected: selected
                                    });
                                }
                            }).reloadList();                            
                        }
                    });
                    pandora.$ui.filters.updateMenus();
                }
                if (pandora.user.ui.listView == 'map') {
                    pandora.$ui.map.resizeMap();
                } else if (pandora.user.ui.listView == 'calendar') {
                    pandora.$ui.calendar.resizeCalendar();
                } else if (pandora.user.ui.listView == 'video') {
                    pandora.$ui.list.size();
                }
            }
        });
    } else {
        var that = Ox.IconList({
            borderRadius: pandora.user.ui.icons == 'posters' ? 0 : 8,
            centered: true,
            defaultRatio: pandora.user.ui.icons == 'posters' ? pandora.site.posters.ratio : 1,
            draggable: true,
            id: 'list',
            item: function(data, sort, size) {
                size = size || 64;
                var ui = pandora.user.ui,
                    ratio = ui.icons == 'posters'
                        ? (ui.showSitePosters ? pandora.site.posters.ratio : data.posterRatio) : 1,
                    url = '/' + data.id + '/' + (
                        ui.icons == 'posters'
                        ? (ui.showSitePosters ? 'siteposter' : 'poster') : 'icon'
                    ) + '128.jpg?' + data.modified,
                    format, info, sortKey = sort[0].key;
                if (['title', 'director', 'random'].indexOf(sortKey) > -1) {
                    info = data['year'];
                } else {
                    // fixme: this is duplicated many times
                    format = pandora.getSortKeyData(sortKey).format;
                    if (format) {
                        info = (
                            /^color/.test(format.type.toLowerCase()) ? Ox.Theme : Ox
                        )['format' + Ox.toTitleCase(format.type)].apply(
                            this, [data[sortKey]].concat(format.args || [])
                        );
                        if (sortKey == 'rightslevel') {
                            info.css({width: size * 0.75 + 'px'});
                        }
                    } else {
                        info = data[sortKey];
                    }
                }
                return {
                    height: ratio <= 1 ? size : size / ratio,
                    id: data.id,
                    info: info,
                    title: data.title + (data.director.length ? ' (' + data.director.join(', ') + ')' : ''),
                    url: url,
                    width: ratio >= 1 ? size : size * ratio
                };
            },
            items: function(data, callback) {
                pandora.api.find(Ox.extend(data, {
                    query: pandora.user.ui.find
                }), callback);
            },
            keys: ['director', 'id', 'modified', 'posterRatio', 'title', 'year'],
            max: 1,
            min: 1,
            orientation: 'horizontal',
            pageLength: 32,
            selected: [pandora.user.ui.item],
            size: 64,
            sort: getSort(),
            unique: 'id'
        })
        .addClass('OxMedia')
        .bindEvent({
            copy: function() {
                Ox.Clipboard.copy(pandora.user.ui.item, 'item');
            },
            copyadd: function() {
                Ox.Clipboard.add(pandora.user.ui.item, 'item');
            },
            gainfocus: function() {
                pandora.$ui.mainMenu.replaceItemMenu();
            },
            open: function() {
                that.scrollToSelection();
            },
            openpreview: function() {
                if (pandora.isVideoView()) {
                    pandora.$ui[itemView].gainFocus().triggerEvent('key_space');
                }
            },
            select: function(data) {
                data.ids.length && pandora.UI.set({
                    'item': data.ids[0]
                });
            },
            toggle: function(data) {
                pandora.UI.set({showBrowser: !data.collapsed});
                if (data.collapsed) {
                    // fixme: can we do this for timeline and player too?
                    if (pandora.user.ui.itemView == 'editor') {
                        pandora.$ui.editor && pandora.$ui.editor.gainFocus();
                    }
                }
                if (pandora.user.ui.itemView == 'timeline') {
                    pandora.$ui.timeline.options({
                        height: pandora.$ui.contentPanel.size(1)
                    });
                } else if (pandora.user.ui.itemView == 'map') {
                    pandora.$ui.map.resizeMap();
                } else if (pandora.user.ui.itemView == 'calendar') {
                    pandora.$ui.calendar.resizeCalendar();
                }
            },
            pandora_icons: function(data) {
                that.options({
                    borderRadius: data.value == 'posters' ? 0 : 8,
                    defaultRatio: data.value == 'posters' ? pandora.site.posters.ratio : 1
                }).reloadList();
            },
            pandora_item: function(data) {
                that.options({selected: [data.value]});
                if (['accessed', 'timesaccessed'].indexOf(pandora.user.ui.listSort[0].key) > -1) {
                    Ox.Request.clearCache('find');
                    that.reloadList();
                }
            },
            pandora_listsort: function() {
                that.options({sort: getSort()})
            },
            pandora_showsiteposters: function() {
                pandora.user.ui.icons == 'posters' && that.reloadList(true);
            }
        })
        .bindEventOnce({
            load: function() {
                // gain focus if we're on page load or if we've just switched
                // to an item and the not-yet-garbage-collected list still has
                // focus
                if (Ox.Focus.focused() === null || (
                    pandora.$ui.list && pandora.$ui.list.hasFocus()
                )) {
                    that.gainFocus();
                }
            }
        });
        that.css({overflowY: 'hidden'}); // this fixes a bug in firefox
        pandora.enableDragAndDrop(that, false);
    }
    function getSort() {
        return ['text', 'position'].indexOf(pandora.user.ui.listSort[0].key) > -1
            ? pandora.site.user.ui.listSort: pandora.user.ui.listSort
    }
    return that;
};

