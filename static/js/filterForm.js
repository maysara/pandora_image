// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.filterForm = function(list) {
    var that = Ox.Element();
    pandora.api.findLists({
        query: {
            conditions: [{key: 'type', value: 'static', operator: '='}],
            operator: '&'
        },
        keys: ['id'],
        range: [0, 1000],
        sort: [{key: 'user', operator: '+'}, {key: 'name', operator: '+'}]
    }, function(result) {
        that.append(
            that.$filter = Ox.Filter({
                findKeys: pandora.site.itemKeys.map(function(itemKey) {
                    var key = Ox.clone(itemKey, true);
                    key.title = Ox._(key.title);
                    key.type = key.type == 'layer'
                        ? Ox.getObjectById(pandora.site.layers, key.id).type
                        : key.type;
                    if (key.format && key.format.type == 'ColorPercent') {
                        key.format.type = 'percent';
                    }
                    return key;
                }).concat([{
                    id: 'list',
                    title: Ox._('List'),
                    type: 'list',
                    values: result.data.items.map(function(item) {
                        return item.id;
                    })
                }]),
                list: list ? null : {
                    sort: pandora.user.ui.listSort,
                    view: pandora.user.ui.listView
                },
                query: Ox.clone(list ? list.query : pandora.user.ui.find, true),
                sortKeys: pandora.site.sortKeys,
                viewKeys: pandora.site.listViews
            })
            .css({padding: '16px'})
            .bindEvent({
                change: function(data) {
                    if (list) {
                        pandora.api.editList({
                            id: list.id,
                            query: data.query
                        }, function(result) {
                            if (pandora.user.ui.updateAdvancedFindResults) {
                                that.updateResults(data.query);
                            }
                        });
                    } else if (pandora.user.ui.updateAdvancedFindResults) {
                        that.updateResults();
                    }
                    that.triggerEvent('change', data);
                }
            })
        );
        that.getList = that.$filter.getList;
    });
    that.updateResults = function(query) {
        if (list) {
            Ox.Request.clearCache(list.id);
            pandora.$ui.list
                .bindEventOnce({
                    init: function(data) {
                        pandora.$ui.folderList[
                            pandora.getListData().folder
                        ].value(list.id, 'query', query);
                    }
                })
                .reloadList();
            pandora.$ui.filters.forEach(function($filter) {
                $filter.reloadList();
            });
        } else {
            pandora.UI.set({find: Ox.clone(that.$filter.options('query'), true)});
            pandora.$ui.findElement.updateElement();
        }
    };
    return that;
};

