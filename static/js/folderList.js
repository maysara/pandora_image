// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.folderList = function(id, section) {
    section = section || pandora.user.section;
    var ui = pandora.user.ui,
        i = Ox.getIndexById(pandora.site.sectionFolders[section], id),
        folderItems = section == 'items' ? 'Lists' : Ox.toTitleCase(section),
        folderItem = folderItems.slice(0, -1),
        canEditFeatured = pandora.site.capabilities['canEditFeatured' + folderItems][pandora.user.level],
        that;
    var columns, items;
    if (id != 'volumes') {
        columns = [
            {
                clickable: function(data) {
                    return data.user == pandora.user.username || (id == 'featured' && canEditFeatured);
                },
                format: function(value, data) {
                    return $('<img>').attr({
                            src: '/' + folderItem.toLowerCase() + '/' + data.id + '/icon.jpg?' + data.modified
                        }).css({
                            width: '14px',
                            height: '14px',
                            borderRadius: '4px',
                            margin: '0 0 0 -3px'
                        });
                },
                id: 'user',
                operator: '+',
                tooltip: function(data) {
                    return data.user == pandora.user.username
                        || (id == 'featured' && canEditFeatured)
                        ? Ox._('Edit Icon')
                        : '';
                },
                visible: true,
                width: 16
            },
            {
                format: function(value) {
                    return Ox.encodeHTMLEntities(value.split(':').join(': '));
                },
                id: 'id',
                operator: '+',
                visible: id == 'favorite',
                // fixme: user and name are set to the same width here,
                // but resizeFolders will set them to different widths
                width: ui.sidebarWidth - (section == 'items' ? 96 : 48)
            },
            {
                editable: function(data) {
                    return data.user == pandora.user.username;
                },
                format: function(value) {
                    return Ox.encodeHTMLEntities(value);
                },
                id: 'name',
                input: {
                    autovalidate: pandora.ui.autovalidateListname
                },
                operator: '+',
                tooltip: id == 'personal' ? Ox._('Edit Title') : '',
                unformat: function(value) {
                    return Ox.decodeHTMLEntities(value);
                },
                visible: id != 'favorite',
                width: ui.sidebarWidth - (section == 'items' ? 96 : 48)
            },
            {
                align: 'right',
                id: 'items',
                format: {type: 'number'},
                operator: '-',
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
                tooltip: function(data) {
                    return data.type == 'static'
                        ? (data.user == pandora.user.username ? Ox._('Edit Default View') : Ox._('Default View: ...'))
                        : data.type == 'smart'
                        ? (data.user == pandora.user.username ? Ox._('Edit Query') : Ox._('Show Query'))
                        : data.type.toUpperCase();
                },
                visible: true,
                width: 16
            },
            {
                clickable: id == 'personal',
                format: function(value) {
                    var symbols = {personal: 'Publish', favorite: 'Like', featured: 'Star'};
                    return $('<img>')
                        .attr({
                            src: Ox.UI.getImageURL(
                                'symbol' + symbols[id]
                            )
                        })
                        .css({
                            width: '10px',
                            height: '10px',
                            padding: '3px',
                            opacity: value == 'private' ? 0.25 : 1
                        });
                },
                id: 'status',
                operator: '+',
                tooltip: id == 'personal' ? function(data) {
                    return data.status == 'private' ? Ox._('Make Public') : Ox._('Make Private');
                } : null,
                visible: true,
                width: 16
            }
        ];
        items = function(data, callback) {
            var query;
            if (id == 'personal') {
                query = {conditions: [
                    {key: 'user', value: pandora.user.username, operator: '=='},
                    {key: 'status', value: 'featured', operator: '!='}
                ], operator: '&'};
            } else if (id == 'favorite') {
                query = {conditions: [
                    {key: 'subscribed', value: true, operator: '='},
                    {key: 'status', value: 'featured', operator: '!='}
                ], operator: '&'};
            } else if (id == 'featured') {
                query = {conditions: [
                    {key: 'status', value: 'featured', operator: '='} // fixme: '==' performs better
                ], operator: '&'};
            }
            return pandora.api['find' + folderItems](Ox.extend(data, {
                query: query
            }), callback);
        };
    } else {
        columns = [
            {
                format: function() {
                    return $('<img>').attr({
                            src: Ox.UI.getImageURL('symbolVolume')
                        }).css({
                            width: '10px',
                            height: '10px',
                            padding: '3px'
                        });
                },
                id: 'user',
                operator: '+',
                visible: true,
                width: 16
            },
            {
                editable: true,
                id: 'name',
                operator: '+',
                tooltip: Ox._('Edit Title'),
                visible: true,
                width: ui.sidebarWidth - 96
            },
            {
                align: 'right',
                id: 'items',
                format: {type: 'number'},
                operator: '-',
                visible: true,
                width: 48
            },
            {
                clickable: function(data) {
                    return data.mounted;
                },
                format: function(value, data) {
                    return $('<img>')
                        .attr({
                            src: Ox.UI.getImageURL(data.mounted ? 'symbolSync' : 'symbolEdit')
                        })
                        .css({
                            width: '10px',
                            height: '10px',
                            padding: '3px'
                        });
                },
                id: 'path',
                operator: '+',
                tooltip: function(data) {
                    return data.mounted ? Ox._('Scan Volume') : Ox._('Edit Path');
                },
                visible: true,
                width: 16
            },
            {
                clickable: true,
                format: function(value, data) {
                    return $('<img>')
                        .attr({
                            src: Ox.UI.getImageURL('symbolMount')
                        })
                        .css({
                            width: '10px',
                            height: '10px',
                            padding: '3px 2px 1px 2px',
                            opacity: data.mounted ? 1 : 0.25
                        });
                },
                id: 'mounted',
                operator: '+',
                tooltip: function(data) {
                    return data.mounted ? Ox._('Unmount Volume') : Ox._('Mount Volume');
                },
                visible: true,
                width: 16
            }
        ];
        items = function(data, callback) {
            var volumes = pandora.user.volumes || [];
            if (!data.keys) {
                data = {items: volumes.length};
            } else {
                data = {items: volumes.map(function(volume) {
                    return Ox.extend({id: volume.name, user: pandora.user.username}, volume);
                })};
            }
            // fixme: ridiculous (we're binding to init too late)
            setTimeout(function() {
                callback({data: data});
            }, 1000);
        };
    }
    that = Ox.TableList({
        columns: columns,
        items: items,
        keys: ['modified'].concat(section == 'items' ? ['query'] : ['rightslevel']),
        max: 1,
        min: 0,
        pageLength: 1000,
        //selected: pandora.getListData().folder == id ? [ui._list] : [],
        sort: [{key: 'position', operator: '+'}],
        sortable: id != 'featured' || canEditFeatured,
        unique: id != 'volumes' ? 'id' : 'name'
    })
    .css({
        left: 0,
        top: 0,
        width: ui.sidebarWidth + 'px'
    })
    .bindEvent({
        add: function(event) {
            // fixme: this is duplicated,
            // see folder collapse panel menu handler
            if (id == 'personal') {
                if (event.keys == '' || event.keys == 'alt') {
                    pandora.api.addList({
                        name: Ox._('Untitled'),
                        status: 'private',
                        type: event.keys == '' ? 'static' : 'smart'
                    }, function(result) {
                        var id = result.data.id;
                        pandora.UI.set({
                            find: {
                                conditions: [{key: 'list', value: id, operator: '=='}],
                                operator: '&'
                            }
                        });
                        Ox.Request.clearCache(); // fixme: remove
                        that.reloadList().bindEventOnce({
                            load: function(data) {
                                that.gainFocus()
                                    .options({selected: [id]})
                                    .editCell(id, 'name');
                            }
                        });
                    });
                }
            } else if (id == 'favorite' || (id == 'featured' && canEditFeatured)) {
                // this makes the button trigger a change event,
                // which is already being handled in folders.js
                pandora.$ui.manageListsButton[id].options({value: true});
                /*
                if (!pandora.site.sectionFolders.items[i].showBrowser) {
                    pandora.site.sectionFolders.items[i].showBrowser = true;
                    pandora.$ui.manageListsButton[id].options({selected: true});
                    pandora.$ui.folderList[id].replaceWith(
                        pandora.$ui.folderBrowser[id] = pandora.ui.folderBrowser(id)
                    );
                }
                */
            }
        },
        click: function(data) {
            //var $list = pandora.$ui.folderList[id];
            if (data.key == 'user') {
                pandora.$ui.listDialog = pandora.ui.listDialog('icon').open();
            } else if (data.key == 'type') {
                if (that.value(data.id, 'type') == 'smart') {
                    pandora.$ui.listDialog = pandora.ui.listDialog('query').open();
                }
            } else if (data.key == 'status') {
                var status = that.value(data.id, data.key) == 'private' ? 'public' : 'private';
                pandora.changeFolderItemStatus(data.id, status, function(result) {
                    that.value(result.data.id, 'status', result.data.status);
                });
            } else if (data.key == 'path') {
                
            } else if (data.key == 'mounted') {
                alert(JSON.stringify(data));
            }
        },
        'delete': function(data) {
            if (id == 'personal') {
                pandora.ui.deleteListDialog(data.ids[0]).open();
            } else if (id == 'favorite') {
                that.options({selected: []});
                pandora.api['unsubscribeFrom' + folderItem]({
                    id: data.ids[0]
                }, function(result) {
                    Ox.Request.clearCache(); // fixme: remove
                    that.reloadList();
                });
            } else if (id == 'featured' && canEditFeatured) {
                that.options({selected: []});
                pandora.api['edit' + folderItem]({
                    id: data.ids[0],
                    status: 'public'
                }, function(result) {
                    // fixme: duplicated
                    if (result.data.user == pandora.user.username || result.data.subscribed) {
                        Ox.Request.clearCache(); // fixme: remove
                        pandora.$ui.folderList[
                            result.data.user == pandora.user.username ? 'personal' : 'favorite'
                        ].reloadList();
                    }
                    that.reloadList();
                });
            }
        },
        /*
        edit: function() {
            pandora.ui.listDialog().open();
        },
        */
        init: function(data) {
            if (pandora.site.sectionFolders[section][i]) {
                pandora.site.sectionFolders[section][i].items = data.items;
                pandora.$ui.folder[i].$content.css({
                    height: data.items * 16 + 'px'
                });
                pandora.$ui.folderList[id].css({
                    height: data.items * 16 + 'px'
                });
            }
            pandora.resizeFolders();
        },
        move: function(data) {
            pandora.api['sort' + folderItems]({
                section: id,
                ids: data.ids
            }, function() {
                Ox.Request.clearCache('find' + folderItems);
            });
        },
        paste: function() {
            pandora.$ui.list.triggerEvent('paste');
        },
        select: function(data) {
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
        },
        submit: function(data) {
            var data_ = {id: data.id};
            data_[data.key] = data.value;
            pandora.api['edit' + folderItem](data_, function(result) {
                if (result.data.id != data.id) {
                    Ox.Request.clearCache();
                    pandora.renameList(data.id, result.data.id, result.data.name, id);
                    pandora.$ui.info.updateListInfo();
                }
            });
        }
    });
    return that;
};
