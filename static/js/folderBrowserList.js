// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.folderBrowserList = function(id, section) {
    // fixme: user and name are set to the same width here,
    // but resizeFolders will set them to different widths
    section = pandora.user.ui.section;
    var ui = pandora.user.ui,
        columnWidth = (ui.sidebarSize - Ox.UI.SCROLLBAR_SIZE - (section == 'items' ? 96 : 48)) / 2,
        i = Ox.getIndexById(pandora.site.sectionFolders[section], id),
        folderItems = section == 'items' ? 'Lists' : Ox.toTitleCase(section),
        folderItem = folderItems.slice(0, -1),
        that = Ox.TableList({
            columns: [
                {
                    clickable: true,
                    format: function(value) {
                        return $('<img>').attr({
                                src: '/list/' + value + '/icon.jpg'
                            }).css({
                                width: '14px',
                                height: '14px',
                                borderRadius: '4px',
                                margin: '0 0 0 -3px'
                            });
                    },
                    // FIXME: why does the above only work with clickable: true ??
                    /*
                    format: function() {
                        return $('<img>').attr({
                            src: Ox.UI.getImageURL('symbolIcon')
                        }).css({
                            width: '10px',
                            height: '10px',
                            padding: '3px'
                        });
                    },
                    */
                    id: 'id',
                    titleImage: 'icon',
                    visible: true,
                    width: 16
                },
                {
                    format: function(value) {
                        return Ox.encodeHTMLEntities(value);
                    },
                    id: 'user',
                    operator: '+',
                    title: Ox._('User'),
                    visible: true,
                    width: Math.floor(columnWidth)
                },
                {
                    format: function(value) {
                        return Ox.encodeHTMLEntities(value);
                    },
                    id: 'name',
                    operator: '+',
                    title: Ox._(folderItem),
                    visible: true,
                    width: Math.ceil(columnWidth)
                },
                {
                    align: 'right',
                    id: 'items',
                    format: {type: 'number'},
                    operator: '-',
                    title: Ox._('Items'),
                    visible: section == 'items',
                    width: 48
                },
                {
                    clickable: function(data) {
                        return section == 'items' && (
                            data.type == 'smart' || data.user == pandora.user.username
                        );
                    },
                    format: function(value, data) {
                        return $('<img>')
                            .attr({
                                src: Ox.UI.getImageURL(
                                    value == 'static' ? 'symbolClick'
                                    : value == 'smart' ? 'symbolFind'
                                    : value == 'html' ? 'symbolFile'
                                    : 'symbolBook'
                                )
                            })
                            .css({
                                width: '10px',
                                height: '10px',
                                padding: '3px',
                                opacity: section == 'texts' || data.user == pandora.user.username ? 1 : 0.25
                            });
                    },
                    id: 'type',
                    operator: '+',
                    titleImage: 'edit',
                    tooltip: function(data) {
                        return data.type == 'static'
                            ? (data.user == pandora.user.username ? Ox._('Edit Default View') : Ox._('Default View: ...'))
                            : data.type == 'smart'
                            ? (data.user == pandora.user.username ? Ox._('Edit Query') : Ox._('Show Query'))
                            : Ox._(data.type.toUpperCase());
                    },
                    visible: true,
                    width: 16
                },
                {
                    clickable: true,
                    format: function(value) {
                        return $('<img>')
                            .attr({
                                src: Ox.UI.getImageURL(
                                    'symbol' + (id == 'favorite' ? 'Like' : 'Star')
                                )
                            })
                            .css({
                                width: '10px',
                                height: '10px',
                                padding: '3px',
                                opacity: id == 'favorite'
                                    ? (value ? 1 : 0.25)
                                    : (value == 'featured' ? 1 : 0.25)
                            });
                    },
                    id: id == 'favorite' ? 'subscribed' : 'status',
                    operator: '+',
                    titleImage: id == 'favorite' ? 'like' : 'star',
                    tooltip: function(data) {
                        var checked = id == 'favorite' ? data.subscribed : data.status == 'featured';
                        return Ox._((checked ? 'Remove from' : 'Add to')
                            + ' ' + Ox.toTitleCase(id) + ' ' + folderItems);
                    },
                    visible: true,
                    width: 16
                }
            ],
            columnsVisible: true,
            items: function(data, callback) {
                var query = id == 'favorite' ? {conditions: [
                    {key: 'status', value: 'public', operator: '='},
                    {key: 'user', value: pandora.user.username, operator: '!=='}
                ], operator: '&'} : {conditions: [
                    {key: 'status', value: 'private', operator: '!='}
                ], operator: ''};
                return pandora.api['find' + folderItems](Ox.extend(data, {
                    query: query
                }), callback);
            },
            // needed in order to determine if, when switching back
            // from featured browser to featured folder, the selected
            // not-featured list may be in the user's favorites folder
            keys: id == 'featured' ? ['subscribed'] : [],
            pageLength: 1000,
            selected: pandora.getListData().folder == id ? [section == 'items' ? ui._list : ui[section.slice(0, -1)]] : [],
            sort: [{key: 'name', operator: '+'}],
            unique: 'id'
        })
        .bindEvent({
            click: function(data) {
                if (data.key == 'type') {
                    /*
                    if (that.value(data.id, 'type') == 'smart') {
                        pandora.$ui.filterDialog = pandora.ui.filterDialog(that.value(data.id, 'query')).open();
                    }
                    */
                } else if (data.key == 'subscribed') {
                    var subscribed = that.value(data.id, 'subscribed');
                    pandora.api[subscribed ? 'unsubscribeFrom' + folderItem : 'subscribeTo' + folderItem]({
                        id: data.id
                    }, function(result) {
                        that.value(data.id, 'subscribed', !subscribed);
                    });
                } else if (data.key == 'status') {
                    pandora.api['edit' + folderItem]({
                        id: data.id,
                        status: that.value(data.id, 'status') == 'featured' ? 'public' : 'featured'
                    }, function(result) {
                        Ox.Log('', 'result', result)
                        if (result.data.user == pandora.user.username || result.data.subscribed) {
                            Ox.Request.clearCache(); // fixme: removen
                            pandora.$ui.folderList[
                                result.data.user == pandora.user.username ? 'personal' : 'favorite'
                            ].reloadList();
                        }
                        that.value(data.id, 'status', result.data.status);
                    });
                }
            },
            init: function(data) {
                pandora.site.sectionFolders[section][i].items = data.items;
                pandora.$ui.folder[i].$content.css({
                    height: 40 + data.items * 16 + 'px'
                });
                pandora.$ui.folderList[id].css({
                    height: 16 + data.items * 16 + 'px'
                });
                pandora.resizeFolders();
            },
            paste: function(data) {
                if (section == 'items') {
                    pandora.$ui.list.triggerEvent('paste', data);
                }
            },
            select: function(data) {
                // fixme: duplicated
                var list = data.ids.length ? data.ids[0] : '';
                if (list) {
                    Ox.forEach(pandora.$ui.folderList, function($list, id_) {
                        id != id_ && $list.options('selected', []);
                    });
                }
                if (section == 'items') {
                    pandora.UI.set({
                        find: {
                            conditions: list ? [
                                {key: 'list', value: data.ids[0], operator: '=='}
                            ] : [],
                            operator: '&'
                        }
                    });
                } else {
                    pandora.UI.set(section.slice(0, -1), list);
                }
            }
        });
    return that;
};
