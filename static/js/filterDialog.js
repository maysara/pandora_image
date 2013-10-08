// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.filterDialog = function(list) {

    var that = Ox.Dialog({
            buttons: [
                Ox.Button({
                        id: 'done',
                        title: Ox._('Done')
                    })
                    .bindEvent({
                        click: function() {
                            var list = pandora.$ui.filterForm.getList();
                            if (list.save) {
                                pandora.api.addList({
                                    name: list.name,
                                    query: list.query,
                                    status: 'private',
                                    type: 'smart'
                                }, function(result) {
                                    var $list = pandora.$ui.folderList.personal,
                                        id = result.data.id;
                                    pandora.UI.set({
                                        find: {
                                            conditions: [{key: 'list', value: id, operator: '=='}],
                                            operator: '&'
                                        }
                                    });
                                    Ox.Request.clearCache(); // fixme: remove
                                    $list.bindEventOnce({
                                            load: function(data) {
                                                $list.gainFocus()
                                                    .options({selected: [id]});
                                            }
                                        })
                                        .reloadList();
                                });
                            } else if (!pandora.user.ui.updateAdvancedFindResults) {
                                pandora.$ui.filterForm.updateResults();
                            }
                            that.close();
                        }
                    })
            ],
            content: pandora.$ui.filterForm = pandora.ui.filterForm(list),
            maxWidth: 648 + Ox.UI.SCROLLBAR_SIZE,
            minHeight: 264,
            minWidth: 648 + Ox.UI.SCROLLBAR_SIZE,
            height: 264,
            // keys: {enter: 'save', escape: 'cancel'},
            removeOnClose: true,
            title: list ? Ox._('Smart List - {0}', [list.name]) : Ox._('Advanced Find'),
            width: 648 + Ox.UI.SCROLLBAR_SIZE
        }),

        $updateCheckbox = Ox.Checkbox({
                title: Ox._('Update Results in the Background'),
                value: pandora.user.ui.updateAdvancedFindResults
            })
            .css({float: 'left', margin: '4px'})
            .bindEvent({
                change: function(data) {
                    pandora.UI.set({updateAdvancedFindResults: data.value});
                    data.value && pandora.$ui.filterForm.updateResults();
                }
            });

    $($updateCheckbox.find('.OxButton')[0]).css({margin: 0});
    $(that.find('.OxBar')[1]).append($updateCheckbox);

    return that;

};

