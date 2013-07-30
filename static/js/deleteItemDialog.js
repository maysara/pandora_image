// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.deleteItemDialog = function(item) {

    var that = pandora.ui.iconDialog({
            buttons: [
                Ox.Button({
                    id: 'keep',
                    title: Ox._('Keep {0}', [Ox._(pandora.site.itemName.singular)])
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                }),
                Ox.Button({
                    id: 'delete',
                    title: Ox._('Delete {0}', [Ox._(pandora.site.itemName.singular)])
                }).bindEvent({
                    click: function() {
                        that.close();
                        pandora.api.remove({
                            id: item.id
                        }, function(result) {
                            Ox.Request.clearCache();
                            pandora.UI.set({item: ''});
                        });
                    }
                })
            ],
            keys: {enter: 'delete', escape: 'keep'},
            text: Ox._('Are you sure you want to delete the {0} "{1}"?'
                + '<br><br>All data will be removed.',
                [Ox._(pandora.site.itemName.singular), item.title]),
            title: Ox._('Delete {0}', [Ox._(pandora.site.itemName.singular)])
        });

    return that;

};

