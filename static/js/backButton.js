// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.backButton = function() {
    var that = Ox.Button({
        title: Ox._('Back to {0}', [Ox._(pandora.site.itemName.plural)]),
        width: 96
    }).css({
        float: 'left',
        margin: '4px 0 0 4px'
    })
    .bindEvent({
        click: function() {
            /*
            FIXME: if, on page load, one clicks back quickly,
            the item content may overwrite the list content.
            but we cannot cancel all requests, since that
            might keep the lists folders from loading.
            so we'd have to cancel with a function -- and
            it's unclear if the best place for that is here
            */
            if (['accessed', 'timesaccessed'].indexOf(pandora.user.ui.listSort[0].key) > -1) {
                Ox.Request.clearCache('find');
            }
            pandora.UI.set({item: ''});
        }
    });
    return that;
};
