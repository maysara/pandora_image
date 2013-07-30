// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.publicListsDialog = function() { // fixme: unused
    var that = Ox.Dialog({
        buttons: [
            Ox.Button({
                id: 'done',
                title: Ox._('Done')
            }).bindEvent({
                click: function() {
                    that.close();
                }
            })
        ],
        content: pandora.ui.publicListsList(),
        height: 320,
        keys: {enter: 'close', escape: 'close'},
        padding: 0,
        title: Ox._('Public Lists'),
        width: 420
    })
    .css({
        position: 'absolute'
    });
    return that;
};
