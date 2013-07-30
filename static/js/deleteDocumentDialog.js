// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.deleteDocumentDialog = function(file, callback) {

    var that = pandora.ui.iconDialog({
            buttons: [
                Ox.Button({
                    id: 'keep',
                    title: Ox._('Keep Document')
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                }),
                Ox.Button({
                    id: 'delete',
                    title: Ox._('Delete Document')
                }).bindEvent({
                    click: function() {
                        that.close();
                        pandora.api.removeDocument({
                            id: file
                        }, callback);
                    }
                })
            ],
            keys: {enter: 'delete', escape: 'keep'},
            text: Ox._('Are you sure you want to delete the document "{0}"?', [file]),
            title: Ox._('Delete Document')
        });

    return that;

};

