// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.documentsDialog = function(options) {
    options = options || {};

    var dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),
        itemWidth = 272 + Ox.UI.SCROLLBAR_SIZE,
        selected = null,

        $reloadButton = Ox.Button({
                disabled: true,
                title: 'redo',
                tooltip: Ox._('Reload'),
                type: 'image'
            })
            .css({float: 'left', margin: '4px 2px 4px 4px'})
            .bindEvent({
                click: function() {
                    $reloadButton.options({disabled: true});
                    Ox.Request.clearCache('findDocuments');
                    $list.reloadList(true);
                }
            }),

        $userCheckbox = Ox.Checkbox({
                title: Ox._('Only show my documents'),
                value: false
            })
            .css({float: 'left', margin: '4px 2px'})
            .bindEvent({
                change: function(data) {
                    data.value
                        ? $robotsCheckbox.show()
                        : $robotsCheckbox.hide().options({value: false});
                    updateList();
                }
            }),

        $findSelect = Ox.Select({
                items: [
                    {id: 'all', title: Ox._('Find: All')},
                    {id: 'user', title: Ox._('Find: Username')},
                    {id: 'file', title: Ox._('Find: Filename')}
                ],
                overlap: 'right',
                type: 'image'
            })
            .bindEvent({
                change: function(data) {
                    $findInput.value() && updateList();
                    $findInput.options({placeholder: data.title});
                }
            }),

        $findInput = Ox.Input({
                changeOnKeypress: true,
                clear: true,
                placeholder: Ox._('Find: All'),
                width: 192
            })
            .bindEvent({
                change: updateList
            }),

        $findElement = Ox.FormElementGroup({
                elements: [
                    $findSelect,
                    $findInput
                ]
            })
            .css({float: 'right', margin: '4px'}),

        $list = Ox.TableList({
                columns: [
                    {
                        id: 'user',
                        operator: '+',
                        title: Ox._('Username'),
                        visible: true,
                        width: 128
                    },
                    {
                        align: 'right',
                        id: 'name',
                        operator: '+',
                        title: Ox._('Filename'),
                        visible: true,
                        width: 256
                    },
                    {
                        id: 'extension',
                        operator: '+',
                        title: Ox._('Extension'),
                        visible: true,
                        width: 64
                    },
                    {
                        align: 'right',
                        format: function(value) {
                            return Ox.formatValue(value, 'B');
                        },
                        id: 'size',
                        operator: '-',
                        title: Ox._('Size'),
                        visible: true,
                        width: 64
                    },
                    {
                        align: 'right',
                        id: 'matches',
                        operator: '-',
                        title: Ox._('Matches'),
                        visible: true,
                        width: 64
                    },
                    {
                        id: 'description',
                        operator: '+',
                        title: Ox._('Description'),
                        visible: true,
                        width: 256
                    },
                    {
                        align: 'right',
                        format: function(value) {
                            return Ox.formatDate(value, '%F %T');
                        },
                        id: 'created',
                        operator: '-',
                        title: Ox._('Created'),
                        visible: true,
                        width: 144
                    },
                    {
                        align: 'right',
                        format: function(value) {
                            return Ox.formatDate(value, '%F %T');
                        },
                        id: 'modified',
                        operator: '-',
                        title: Ox._('Modified'),
                        visible: true,
                        width: 144
                    }
                ],
                columnsVisible: true,
                items: pandora.api.findDocuments,
                keys: ['ratio'],
                query: {conditions: [], operator: '&'},
                scrollbarVisible: true,
                sort: [{key: 'user', operator: '+'}],
                unique: 'id'
            })
            .bindEvent({
                init: function(data) {
                    $status.html(
                        Ox.toTitleCase(Ox.formatCount(data.items, 'file'))
                    );
                },
                load: function() {
                    $reloadButton.options({disabled: false});
                },
                select: function(data) {
                    selected = data.ids[0];
                    selectFile();
                    options.callback && $doneButton.options({
                        disabled: !data.ids.length
                    });
                }
            }),

        $embedButton = Ox.Button({
                title: 'embed',
                tooltip: Ox._('Embed'),
                type: 'image'
            })
            .css({
                float: 'left',
                margin: '4px 2px 4px 4px'
            })
            .bindEvent({
                click: function() {
                    pandora.ui.embedDocumentDialog(
                        $list.options('selected')[0]
                    ).open();
                }
            }),

        $closeButton = Ox.Button({
                title: 'close',
                tooltip: Ox._('Close'),
                type: 'image'
            })
            .css({
                float: 'left',
                margin: '4px 4px 4px 2px'
            })
            .bindEvent({
                click: function() {
                    $list.options({selected: []});
                }
            }),

        $item = Ox.Element().css({overflowY: 'scroll'}),

        $preview,

        $form,

        $itemToolbar = Ox.Bar({size: 24}),

        $deleteButton = Ox.Button({
                title: Ox._('Delete Document...'),
                width: 128
            })
            .css({float: 'left', margin: '4px'})
            .hide()
            .bindEvent({
                click: deleteFile
            })
            .appendTo($itemToolbar),
        
        $doneButton = Ox.Button({
                disabled: !!options.callback,
                id: 'done',
                title: options.callback ? Ox._('Select') : Ox._('Done'),
                width: 48
            }).bindEvent({
                click: function() {
                    options.callback && options.callback($list.options('selected'));
                    that.close();
                }
            }),

        $uploadButton = Ox.FileButton({
                maxFiles: 1,
                title: Ox._('Upload Document...'),
                width: 128
            })
            .css({float: 'right', margin: '4px'})
            .bindEvent({
                click: uploadFile
            })
            .appendTo($itemToolbar),

        $content = Ox.SplitPanel({
            elements: [
                {
                    element: Ox.SplitPanel({
                        elements: [
                            {
                                element: Ox.Bar({size: 24})
                                    .append($reloadButton)
                                    .append($userCheckbox)
                                    .append($findElement),
                                size: 24
                            },
                            {
                                element: $list
                            }
                        ],
                        orientation: 'vertical'
                    })
                },
                {
                    element: Ox.SplitPanel({
                            elements: [
                                {
                                    element: Ox.Bar({size: 24})
                                        .append($itemLabel),
                                    size: 24
                                },
                                {
                                    element: $item
                                },
                                {
                                    element: $itemToolbar,
                                    size: 24
                                }
                            ],
                            orientation: 'vertical'
                        })
                        .bindEvent({
                            resize: setWidth
                        }),
                    resizable: true,
                    resize: [
                        272 + Ox.UI.SCROLLBAR_SIZE,
                        400 + Ox.UI.SCROLLBAR_SIZE,
                        528 + Ox.UI.SCROLLBAR_SIZE
                    ],
                    size: 272 + Ox.UI.SCROLLBAR_SIZE
                }
            ],
            orientation: 'horizontal'
        }),

        $itemLabel = Ox.Label({
                textAlign: 'center',
                title: Ox._('No document selected'),
                width: getLabelWidth()
            })
            .css({
                float: 'left',
                margin: '4px'
            }),

        that = Ox.Dialog({
                buttons: [$doneButton],
                closeButton: true,
                content: $content,
                height: dialogHeight,
                maximizeButton: true,
                minHeight: 256,
                minWidth: 512,
                padding: 0,
                removeOnClose: true,
                title: Ox._('Manage Documents'),
                width: dialogWidth
            }),

        $status = $('<div>')
            .css({
                position: 'absolute',
                top: '4px',
                left: '128px',
                right: '384px',
                bottom: '4px',
                paddingTop: '2px',
                fontSize: '9px',
                textAlign: 'center'
            })
            .appendTo(that.find('.OxButtonsbar'));

    that.superClose = that.close;
    that.close = function() {
        Ox.Request.clearCache('findDocuments');
        that.superClose();
    };

    function deleteFile() {
        pandora.ui.deleteDocumentDialog($list.options('selected')[0], function() {
            Ox.Request.clearCache('findDocuments');
            $list.reloadList();
        }).open();
    }

    function getLabelWidth() {
        return $content.size(1) - (selected ? 48 : 8);
    }

    function getPreviewSize() {
        var ratio = $list.value(selected, 'ratio'),
            height = ratio < 1 ? 256 : 256 / ratio,
            width = ratio >= 1 ? 256 : 256 * ratio,
            left = Math.floor((itemWidth - 16 - Ox.UI.SCROLLBAR_SIZE - width) / 2);
        return {
            height: height,
            // fixme: CSS gets applied twice, to image and enclosing element
            margin: [8, 8, 8, 8 + left].map(function(px) {
                return px / 2 + 'px';
            }).join(' '),
            width: width
        };
    }

    function renderForm() {
        var file = $list.value(selected),
            editable = file.user == pandora.user.username
                || pandora.site.capabilities.canEditMedia[pandora.user.level];
        return Ox.Form({
            items: [
                Ox.Input({
                    disabled: true,
                    id: 'username',
                    label: Ox._('Username'),
                    labelWidth: 80,
                    value: file.user,
                    width: itemWidth - 16 - Ox.UI.SCROLLBAR_SIZE
                }),
                Ox.Input({
                    disabled: !editable,
                    id: 'name',
                    label: Ox._('Filename'),
                    labelWidth: 80,
                    value: file.name,
                    width: itemWidth - 16 - Ox.UI.SCROLLBAR_SIZE
                }),
                Ox.Input({
                    disabled: true,
                    id: 'extension',
                    label: Ox._('Extension'),
                    labelWidth: 80,
                    value: file.extension,
                    width: itemWidth - 16 - Ox.UI.SCROLLBAR_SIZE
                }),
                Ox.Input({
                    disabled: true,
                    id: 'size',
                    label: Ox._('Size'),
                    labelWidth: 80,
                    value: Ox.formatValue(file.size, 'B'),
                    width: itemWidth - 16 - Ox.UI.SCROLLBAR_SIZE
                }),
                Ox.Input({
                    disabled: true,
                    id: 'matches',
                    label: Ox._('Matches'),
                    labelWidth: 80,
                    value: file.matches,
                    width: itemWidth - 16 - Ox.UI.SCROLLBAR_SIZE
                }),
                Ox.Input({
                    disabled: !editable,
                    height: 256,
                    id: 'description',
                    placeholder: Ox._('Description'),
                    type: 'textarea',
                    value: file.description,
                    width: itemWidth - 16 - Ox.UI.SCROLLBAR_SIZE
                })
            ],
            width: 240
        })
        .css({margin: '12px 8px 8px 8px'})
        .bindEvent({
            change: function(event) {
                var data = Ox.extend({id: file.id}, event.id, event.data.value);
                pandora.api.editFile(data, function(result) {
                    $list.value(result.data.id, event.id, result.data[event.id]);
                    if (event.id == 'name') {
                        $list.value(file.id, 'id', result.data.id);
                    }
                    Ox.Request.clearCache('findDocuments');
                    $list.reloadList();
                });
            }
        });
    }

    function renderPreview() {
        var isImage = Ox.contains(['jpg', 'png'], selected.split('.').pop()),
            size = getPreviewSize(),
            src = '/documents/' + selected + (isImage ? '' : '.jpg');
        return Ox.ImageElement({
                height: size.height,
                src: src,
                width: size.width
            })
            .css({
                margin: size.margin,
                borderRadius: '8px'
            });
    }

    function selectFile() {
        var file = $list.value(selected),
            editable = file.user == pandora.user.username
                || pandora.site.capabilities.canEditMedia[pandora.user.level];
        $embedButton[selected ? 'show' : 'hide']();
        $closeButton[selected ? 'show' : 'hide']();
        setLabel();
        $item.empty();
        if (selected) {
            $preview = renderPreview().appendTo($item);
            $form = renderForm().appendTo($item);
            $deleteButton.options({disabled: !editable}).show();
        } else {
            $deleteButton.hide();
        }
    }

    function setLabel() {
        $itemLabel.options({
            title: selected
                ? selected.split(':').slice(1).join(':')
                : Ox._('No document selected'),
            width: getLabelWidth()
        });
    }

    function setWidth() {
        var size;
        $itemLabel.options({width: getLabelWidth()});
        if (selected) {
            size = getPreviewSize(),
            $preview.options({
                height: size.height,
                width: size.width
            }).css({
                margin: size.margin
            });
            $form.options('items').forEach(function($item) {
                $item.options({width: itemWidth - 16 - Ox.UI.SCROLLBAR_SIZE});
            });
        }
        $status.css({right: itemWidth + 128 + 'px'});
    }

    function updateList() {
        var user = $userCheckbox.value(),
            key = $findSelect.value(),
            value = $findInput.value(),
            query = {
                conditions: value
                    ? [].concat(
                        key != 'name' ? [{key: 'user', value: value, operator: '='}] : [],
                        key != 'user' ? [{key: 'name', value: value, operator: '='}] : []
                    )
                    : [],
                operator: '|'
            };
        $list.options({query: user ? {
            conditions: [
                {key: 'user', value: pandora.user.username, operator: '='},
                query
            ],
            operator: '&'
        } : query});
    }

    function uploadFile(data) {
        pandora.ui.uploadDocumentDialog(data.files[0], function(file) {
            Ox.Request.clearCache('findDocuments');
            pandora.api.findDocuments({
                positions: [file.id],
                query: $list.options('query'),
                sort: $list.options('sort'),
            }, function(data) {
                $list.bindEventOnce({
                    load: function() {
                        $list.options({selected: [file.id]});
                        // selectFile(file.id);
                    }
                });
                if (data.data.positions[file.id] > -1) {
                    $list.reloadList();
                } else {
                    $list.options({
                        query: {conditions: [], operator: '&'}
                    });
                }
            });
        }).open();
    }

    return that;

};

