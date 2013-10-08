// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.namesDialog = function() {

    // FIXME: add cache invalidation

    var height = Math.round((window.innerHeight - 48) * 0.9),
        width = 576 + Ox.UI.SCROLLBAR_SIZE,

        $findInput = Ox.Input({
                changeOnKeypress: true,
                clear: true,
                placeholder: 'Find',
                width: 192
            })
            .css({float: 'right', margin: '4px'})
            .bindEvent({
                change: function(data) {
                    var query = {
                            conditions: [
                                {key: 'name', value: data.value, operator: '='},
                                {key: 'sortname', value: data.value, operator: '='}
                            ],
                            operator: '|'
                        };
                    $list.options({
                        query: query,
                    });
                }
            }),

        $list = Ox.TableList({
                columns: [
                    {
                        id: 'id',
                        title: Ox._('ID'),
                        visible: false,
                        width: 0
                    },
                    {
                        id: 'name',
                        operator: '+',
                        removable: false,
                        title: Ox._('Name'),
                        visible: true,
                        width: 256
                    },
                    {
                        editable: true,
                        id: 'sortname',
                        operator: '+',
                        title: Ox._('Sort Name'),
                        tooltip: Ox._('Edit Sort Name'),
                        visible: true,
                        width: 256
                    },
                    {
                        id: 'numberofnames',
                        align: 'right',
                        operator: '-',
                        title: Ox._('Names'),
                        visible: true,
                        width: 64
                    },
                ],
                columnsVisible: true,
                items: pandora.api.findNames,
                max: 1,
                scrollbarVisible: true,
                sort: [{key: 'sortname', operator: '+'}],
                unique: 'id'
            })
            .bindEvent({
                init: function(data) {
                    $status.html(
                        Ox.toTitleCase(Ox.formatCount(data.items, 'name'))
                    );
                },
                open: function(data) {
                    $list.find('.OxItem.OxSelected > .OxCell.OxColumnSortname')
                        .trigger('mousedown')
                        .trigger('mouseup');
                },
                select: function(data) {
                    $findButton.options({disabled: !data.ids.length});
                },
                submit: function(data) {
                    Ox.Request.clearCache('findNames');
                    pandora.api.editName({
                        id: data.id,
                        sortname: data.value
                    });
                }
            }),

        $findButton = Ox.Button({
                disabled: true,
                title: Ox._('Find'),
                width: 48
            }).bindEvent({
                click: function() {
                    that.close();
                    pandora.UI.set({find: {
                        conditions: [{
                            key: 'name',
                            value: $list.value($list.options('selected'), 'name'),
                            operator: '='
                        }],
                        operator: '&'
                    }});
                    pandora.$ui.findElement.updateElement();
                }
            }),

        that = Ox.Dialog({
                buttons: [
                    Ox.Button({
                        title: Ox._('Manage Titles...')
                    }).bindEvent({
                        click: function() {
                            that.close();
                            (pandora.$ui.titlesDialog || (
                                pandora.$ui.titlesDialog = pandora.ui.titlesDialog()
                            )).open();
                        }
                    }),
                    {},
                    $findButton,
                    Ox.Button({
                        title: Ox._('Done'),
                        width: 48
                    }).bindEvent({
                        click: function() {
                            that.close();
                        }
                    })
                ],
                closeButton: true,
                content: Ox.SplitPanel({
                    elements: [
                        {
                            element: Ox.Bar({size: 24})
                                .append($status)
                                .append(
                                    $findInput
                                ),
                            size: 24
                        },
                        {
                            element: $list
                        }
                    ],
                    orientation: 'vertical'
                }),
                height: height,
                maximizeButton: true,
                minHeight: 256,
                minWidth: 512,
                padding: 0,
                title: Ox._('Manage Names'),
                width: width
            })
            .bindEvent({
                resizeend: function(data) {
                    var width = (data.width - 64 - Ox.UI.SCROLLBAR_SIZE) / 2;
                    [
                        {id: 'name', width: Math.ceil(width)},
                        {id: 'sortname', width: Math.floor(width)}
                    ].forEach(function(column) {
                        $list.resizeColumn(column.id, column.width);
                    });
                }
            }),

        $status = $('<div>')
            .css({
                position: 'absolute',
                top: '4px',
                left: '128px',
                right: '128px',
                bottom: '4px',
                paddingTop: '2px',
                fontSize: '9px',
                textAlign: 'center'
            })
            .appendTo(that.find('.OxButtonsbar'));

    return that;

};

