// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.info = function() {

    var ui = pandora.user.ui,
        folderItems = ui.section == 'items' ? 'Lists' : Ox.toTitleCase(ui.section),
        folderItem = folderItems.slice(0, -1),
        view = getView(),

        that = Ox.Element()
            .css({overflowX: 'hidden', overflowY: 'auto'})
            .bindEvent({
                toggle: function(data) {
                    pandora.UI.set({showInfo: !data.collapsed});
                },
                pandora_find: function() {
                    if (pandora.user.ui._list != pandora.UI.getPrevious('_list')) {
                        updateInfo();
                    }
                },
                pandora_item: updateInfo,
                pandora_listselection: updateInfo,
                pandora_listview: function(data) {
                    if (
                        pandora.isClipView(data.value) != pandora.isClipView(data.previousValue)
                        || data.value == 'timelines' || data.previousValue == 'timelines'
                    ) {
                        updateInfo();
                    }
                },
                pandora_text: updateInfo
            });

    //pandora.$ui.leftPanel && resize();

    updateInfo();

    function emptyInfo() {
        pandora.$ui.listInfo && pandora.$ui.listInfo.remove();
        pandora.$ui.posterInfo && pandora.$ui.posterInfo.remove();
        pandora.$ui.videoPreview && pandora.$ui.videoPreview.remove();
        that.empty();              
    }

    function getId() {
        return ui[folderItem.toLowerCase()] || (
            ui.listSelection.length
            ? ui.listSelection[ui.listSelection.length - 1]
            : null
        );
    }

    function getView() {
        return ui.section == 'items'
            ? !getId()
                ? 'list'
                : !ui.item && pandora.isClipView()
                    ? 'poster'
                    : 'video'
            : folderItem.toLowerCase();
    }

    function resizeInfo() {
        var height = pandora.getInfoHeight(true);
        pandora.$ui.leftPanel.size(2, height);
        pandora.resizeFolders();
        !ui.showInfo && pandora.$ui.leftPanel.css({bottom: -height + 'px'});
    }

    function updateInfo() {
        var id = getId(),
            previousView = view;
        view = getView();
        if (view == 'list' || view == 'text') {
            emptyInfo();
            that.append(pandora.$ui.listInfo = pandora.ui.listInfo());
            previousView == 'video' && resizeInfo();
        } else if (view == 'poster') {
            pandora.api.get({id: id, keys: ['director', 'modified', 'posterRatio', 'title']}, function(result) {
                var ratio = result.data.posterRatio,
                    height = pandora.getInfoHeight(true);
                emptyInfo();
                that.append(
                    pandora.$ui.posterInfo = pandora.ui.posterInfo(Ox.extend(result.data, {id: id}))
                );
                previousView == 'video' && resizeInfo();
            });
        } else if (view == 'video') {
            pandora.api.get({
                id: id,
                keys: ['duration', 'posterFrame', 'rendered', 'videoRatio']
            }, function(result) {
                emptyInfo();
                if (result.data && result.data.rendered) {
                    that.append(
                        pandora.$ui.videoPreview = pandora.ui.videoPreview({
                                duration: result.data.duration,
                                frameRatio: result.data.videoRatio,
                                height: pandora.getInfoHeight(true),
                                id: id,
                                position: !ui.item && ui.listView == 'timelines'
                                    ? (ui.videoPoints[id] ? ui.videoPoints[id].position : 0)
                                    : result.data.posterFrame,
                                videoTooltip: function() {
                                    return (
                                        pandora.user.ui.item
                                        && ['timeline', 'player', 'editor'].indexOf(pandora.user.ui.itemView) > -1
                                    ) ? Ox._('Go to Position') : (
                                        Ox._(pandora.user.ui.item ? 'Switch to {0} View' : 'Open in {0} Vew',
                                            [Ox._(Ox.getObjectById(pandora.site.itemViews, pandora.user.ui.videoView).title)]));
                                },
                                width: ui.sidebarSize
                            })
                            .bindEvent({
                                click: function(data) {
                                    pandora.UI.set(
                                        'videoPoints.' + id,
                                        {'in': 0, out: 0, position: data.position}
                                    );
                                    if (ui.item && ['timeline', 'player', 'editor'].indexOf(ui.itemView) > -1) {
                                        pandora.$ui[ui.itemView].options({
                                            position: data.position
                                        });
                                    } else {
                                        pandora.UI.set({
                                            item: id,
                                            itemView: ui.videoView
                                        });
                                    }
                                }
                            })
                    );
                } else {
                    that.append(
                        Ox.Bar({size: 16}).css({
                            position: 'absolute',
                            bottom: 0
                        }).append(
                            $('<div>').css({
                                marginTop: '2px',
                                fontSize: '9px',
                                textAlign: 'center'
                            }).html(Ox._('No Video'))
                        )
                    );
                }
                previousView != 'video' && resizeInfo();
            });
        }
    }

    that.resizeInfo = function() {
        var view = getView();
        if (view == 'list' || view == 'text') {
            pandora.$ui.listInfo.resizeInfo();
        } else if (view == 'poster') {
            pandora.$ui.posterInfo.resizeInfo();
        } else if (view == 'video') {
            pandora.$ui.videoPreview && pandora.$ui.videoPreview.options({
                height: pandora.getInfoHeight(true),
                width: ui.sidebarSize
            });
        }
    };

    that.updateListInfo = function() {
        ['list', 'text'].indexOf(getView()) > -1 && that.empty().append(
            pandora.$ui.listInfo = pandora.ui.listInfo()
        );
    };

    return that;

};

pandora.ui.listInfo = function() {
    var ui = pandora.user.ui,
        folderItems = ui.section == 'items' ? 'Lists' : Ox.toTitleCase(ui.section),
        folderItem = folderItems.slice(0, -1),
        list = pandora.user.ui.section == 'items' ? pandora.user.ui._list : ui[folderItem.toLowerCase()],
        canEditFeaturedLists = pandora.site.capabilities['canEditFeatured' + folderItems][pandora.user.level],
        that = $('<div>').css({padding: '16px', textAlign: 'center'}),
        $icon = Ox.Element('<img>')
            .attr({
                src: list
                    ? '/' + folderItem.toLowerCase() + '/' + list + '/icon256.jpg?' + Ox.uid()
                    : '/static/png/icon.png'
            })
            .css(getIconCSS())
            .appendTo(that),
        $title, $description;

    that.append($('<div>').css({height: '16px'}));

    //fixme: allow editing
    //pandora.api.editList({id: list, description: 'foobbar'}, callback)
    //pandora.api.editPage({name: 'allItems', body: 'foobar'}, callback)
    if (list) {
        pandora.api['find' + folderItems]({
            query: {conditions: [{key: 'id', value: list, operator: '=='}]},
            keys: ['description', 'status', 'name', 'user']
        }, function(result) {
            if (result.data.items.length) {
                var item = result.data.items[0],
                    editable = item.user == pandora.user.username
                        || (item.status == 'featured' && canEditFeaturedLists);
                if (editable) {
                    $icon.options({
                        tooltip: Ox._('Doubleclick to edit icon')
                    }).bindEvent({
                        doubleclick: editIcon
                    });
                }
                that.append(
                    $title = Ox.Editable({
                            editable: editable,
                            format: function(value) {
                                // FIXME: document what we're trying to do here!
                                return Ox.encodeHTMLEntities(
                                    Ox.decodeHTMLEntities(
                                        item.status == 'featured' || editable
                                            ? value
                                            : item.user + ': ' + value
                                    )
                                )
                            },
                            tooltip: editable ? pandora.getEditTooltip('title') : '',
                            value: item.name,
                            width: pandora.user.ui.sidebarSize - 32
                        })
                        .css({fontWeight: 'bold', textAlign: 'center'})
                        .bindEvent({
                            edit: function() {
                                $title.options({
                                    width: that.width()
                                });
                            },
                            submit: function(data) {
                                data.value = Ox.decodeHTMLEntities(data.value);
                                if (data.value != item.name) {
                                    pandora.api['edit' + folderItem]({
                                        id: list,
                                        name: data.value
                                    }, function(result) {
                                        if (result.data.id != list) {
                                            pandora.renameList(list, result.data.id, result.data.name);
                                            list = result.data.id;
                                            item.name = result.data.name;
                                        }
                                    });
                                }
                            }
                        })
                ).append(
                    $('<div>').css({height: '8px'})
                ).append(
                    $description = Ox.Editable({
                            clickLink: pandora.clickLink,
                            format: function(value) {
                                return '<div class="OxLight" style="text-align: center">'
                                    + value + '</div>';
                            },
                            editable: editable,
                            height: pandora.user.ui.sidebarSize - 32,
                            placeholder: editable
                                ? '<div class="OxLight" style="text-align: center">' + Ox._('No description') + '</span>'
                                : '',
                            tooltip: editable ? pandora.getEditTooltip('description') : '',
                            type: 'textarea',
                            value: item.description,
                            width: pandora.user.ui.sidebarSize - 32
                        })
                        .css({textAlign: 'center'})
                        .bindEvent({
                            edit: function() {
                                // scrollbars may appear
                                setTimeout(function() {
                                    var width = that.width();
                                    $description.options({
                                        height: width,
                                        width: width
                                    });
                                }, 25);
                            },
                            submit: function(data) {
                                if (data.value != item.description) {
                                    pandora.api['edit' + folderItem]({
                                        id: list,
                                        description: data.value
                                    }, function(result) {
                                        item.description = result.data.description;
                                        Ox.Request.clearCache('find' + folderItems);
                                    });
                                }
                            }
                        })
                );
            } else {
                that.append(
                    $('<div>')
                        .css({paddingTop: '16px'})
                        .html(Ox._('{0} not found', [Ox._(folderItem)]))
                );
            }
        });
    } else {
        that.append(
            $('<div>')
                .css({fontWeight: 'bold'})
                .html(ui.section == 'items'
                    ? Ox._('All {0}', [Ox._(pandora.site.itemName.plural)])
                    : Ox._('{0} ' + folderItems, [pandora.site.site.name])
                )
        );
    }

    function editIcon() {
        // timeout is needed since if the icon is clicked before the list
        // folders have loaded, the list dialog cannot get the list data yet.
        if (pandora.getListData().id) {
            pandora.$ui.listDialog = pandora.ui.listDialog('icon').open();
        } else {
            setTimeout(editIcon, 250);
        }
    }

    function getIconCSS() {
        var size = Math.round(pandora.user.ui.sidebarSize / 2);
        return {
            width: size + 'px',
            height: size + 'px',
            borderRadius: Math.round(size / 4) + 'px'
        };
    }

    that.resizeInfo = function() {
        var width = that.width();
        $icon.css(getIconCSS());
        $title && $title.options({
            width: width
        });
        $description && $description.options({
            height: width,
            width: width
        });
    };

    return that;

};

pandora.ui.posterInfo = function(data) {
    var $poster = $('<img>')
            .attr({src: '/' + data.id + '/poster512.jpg?' + data.modified})
            .css(getPosterCSS()),
        $text = $('<div>')
            .css({
                width: pandora.user.ui.sidebarSize - 8 + 'px',
                height: '12px',
                padding: '2px 4px 2px 4px',
                fontSize: '9px',
                textAlign: 'center',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
            })
            .html(
                data.title + (
                    Ox.len(data.director) ? ' (' + data.director.join(', ') + ')' : ''
                )
            ),
        that = Ox.SplitPanel({
            elements: [
                {
                    element: $('<div>').append($poster)
                },
                {
                    element: Ox.Bar({size: 16}).append($text),
                    size: 16
                }
            ],
            orientation: 'vertical'
        });
    function getPosterCSS() {
        var css = {},
            ratio = pandora.user.ui.sidebarSize / (pandora.user.ui.sidebarSize - 16);
        if (data.posterRatio < ratio) {
            css.height = pandora.user.ui.sidebarSize - 16;
            css.width = Math.round(css.height * data.posterRatio);
            css.marginLeft = Math.floor((pandora.user.ui.sidebarSize - css.width) / 2);
        } else {
            css.width = pandora.user.ui.sizebarSize;
            css.height = Math.round(css.width / data.posterRatio);
            css.marginTop = Math.floor((pandora.user.ui.sidebarSize - 16 - css.height) / 2);
        }
        return Ox.map(css, function(value) {
            return value + 'px';
        });
    }
    that.resizeInfo = function() {
        $poster.css(getPosterCSS());
        $text.css({width: pandora.user.ui.sidebarSize - 8 + 'px'})
    }
    return that;
};
