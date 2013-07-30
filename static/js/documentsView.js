// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.documentsView = function(options, self) {

    var self = self || {},
        that = Ox.Element({}, self)
            .defaults({
                id: ''
            })
            .options(options || {});

    self.selected = null;

    self.$toolbar = Ox.Bar({
        size: 24
    });

    self.$preview = Ox.Element();


    self.$documentsList = Ox.TableList({
            columns: [
                {
                    align: 'left',
                    id: 'index',
                    operator: '+',
                    title: Ox._('Index'),
                    visible: false,
                    width: 60
                },
                {
                    align: 'left',
                    id: 'id',
                    operator: '+',
                    title: Ox._('ID'),
                    visible: false,
                    width: 60
                },
                {
                    align: 'left',
                    id: 'user',
                    operator: '+',
                    title: Ox._('User'),
                    visible: false,
                    width: 60
                },
                {
                    align: 'left',
                    id: 'name',
                    operator: '+',
                    title: Ox._('Name'),
                    visible: true,
                    width: 360
                },
                {
                    id: 'extension',
                    operator: '+',
                    title: Ox._('Extension'),
                    visible: false,
                    width: 60
                },
                {
                    editable: true,
                    id: 'description',
                    operator: '+',
                    title: Ox._('Description'),
                    visible: true,
                    width: 240
                }
            ],
            columnsMovable: true,
            columnsRemovable: true,
            columnsResizable: true,
            columnsVisible: true,
            items: options.documents,
            scrollbarVisible: true,
            sort: [{key: 'index', operator: '+'}],
            sortable: true,
            unique: 'id'
        })
        .bindEvent({
            add: function(data) {
                pandora.$ui.documentsDialog = pandora.ui.documentsDialog({
                    callback: function(ids) {
                        if (ids) {
                            pandora.api.addDocument({
                                item: pandora.user.ui.item,
                                ids: ids
                            }, function() {
                                Ox.Request.clearCache();
                                //fixme just upload list here
                                //self.$documentsList.reloadList();
                                pandora.$ui.contentPanel.replaceElement(1,
                                    pandora.$ui.item = pandora.ui.item());
                            });
                        }
                    }
                }).open();
            },
            'delete': function(data) {
                if (data.ids.length > 0 && options.editable) {
                    pandora.api.removeDocument({
                        ids: data.ids,
                        item: pandora.user.ui.item
                    }, function(result) {
                        Ox.Request.clearCache();
                        //fixme just upload list here
                        //self.$documentsList.reloadList();
                        pandora.$ui.contentPanel.replaceElement(1,
                            pandora.$ui.item = pandora.ui.item());
                    });
                }
            },
            move: function(data) {
                Ox.Request.clearCache();
                pandora.api.sortDocuments({
                    item: pandora.user.ui.item,
                    ids: data.ids
                })
            },
            select: selectDocument,
            submit: function(data) {
                var value = self.$documentsList.value(data.id, data.key);
                if (data.value != value && !(data.value === '' && value === null)) {
                    self.$documentsList.value(data.id, data.key, data.value || null);
                    data.key == 'description' && pandora.api.editDocument({
                        description: data.value,
                        id: data.id,
                        item: pandora.user.ui.item
                    }, function(result) {
                        //if description is empty, fall back to global description
                        self.$documentsList.value(data.id, data.key, result.data.description);
                        renderPreview();
                    });
                }
            }
        });

    function renderPreview() {
        var isImage = Ox.contains(['jpg', 'png'],
                self.selected ? self.selected.split('.').pop() : ''),
            size = {width: 256, height: 256},
            src = '/documents/' + self.selected + (isImage ? '' : '.jpg');
        self.$preview.empty();
        self.selected && self.$preview
            .append(Ox.ImageElement({
                height: size.height,
                src: src,
                width: size.width
            }))
            .append(Ox.Element()
                .html(self.$documentsList.value(self.selected, 'description')
            ));
    }
    function selectDocument(data) {
        if (data.ids[0] != self.selected) {
            self.selected = data.ids[0];
            renderPreview();
        }
    }

    that.setElement(Ox.SplitPanel({
            elements: [
                {
                    element: Ox.SplitPanel({
                        elements: [
                            {
                                element: self.$toolbar,
                                size: 24
                            },
                            {
                                element: self.$documentsList
                            },
                        ],
                        orientation: 'vertical'
                    })
                },
                {
                    collapsible: true,
                    element: self.$preview,
                    size: 256
                }
            ],
            orientation: 'horizontal'
        })
    );


    that.reload = function() {
        self.$documentsList.reloadList();
    }
    return that;

};
