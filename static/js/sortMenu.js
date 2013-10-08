// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.sortMenu = function() {

    // FIXME: unused

    var that = Ox.MenuButton({
            items: [].concat(
                pandora.site.clipKeys.map(function(key) {
                    return Ox.extend(Ox.clone(key), {
                        checked: key.id == pandora.user.ui.itemSort[0].key,
                        id: key.id,
                        title: Ox._('Sort by {0}', [key.title])
                    });
                }),
                [
                    {},
                    {id: 'ascending', title: Ox._('Ascending'), checked: pandora.user.ui.itemSort[0].operator == '+'},
                    {id: 'descending', title: Ox._('Descending'), checked: pandora.user.ui.itemSort[0].operator == '-'}
                ]
            ),
            tooltip: Ox._('Sort clips'),
            type: 'image'
        })
        .css({float: 'left', margin: '2px'})
        .bindEvent({
            click: function(data) {
                if (data.checked) {
                    if (['ascending', 'descending'].indexOf(data.id) > -1) {
                        pandora.UI.set({itemSort: [{
                            key: pandora.user.ui.itemSort[0].key,
                            operator: data.id == 'ascending' ? '+' : '-'
                        }]});
                    } else {
                        pandora.UI.set({itemSort: [{
                            key: data.id,
                            operator: pandora.getSortOperator(data.id)
                        }]});
                    }
                }
            },
            pandora_itemsort: function() {
                pandora.$ui.sortMenu.replaceWith(
                    pandora.$ui.sortMenu = pandora.ui.sortMenu()
                );
            }
        });

    return that;
  
};
