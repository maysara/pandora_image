// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.sectionSelect = function(section) {
    // fixme: duplicated
    var that = Ox.Select({
            id: 'sectionSelect',
            items: [
                {id: 'items', title: Ox._(pandora.site.itemName.plural)},
                {id: 'edits', title: Ox._('Edits'), disabled: pandora.user.level != 'admin'},
                {id: 'texts', title: Ox._('Texts'), disabled: pandora.user.level != 'admin'}
            ],
            value: section || pandora.user.ui.section
        }).css({
            float: 'left',
            margin: '4px'
        })
        .bindEvent({
            
        });
    return that;
};

