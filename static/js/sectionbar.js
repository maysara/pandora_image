// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.sectionbar = function(mode, isDragAndDrop) {
    var that = Ox.Bar({
            size: 24
        })
        .append(
            mode == 'buttons'
            ? pandora.$ui.sectionButtons = pandora.ui.sectionButtons(isDragAndDrop)
            : pandora.$ui.sectionSelect = pandora.ui.sectionSelect(isDragAndDrop)
        )
        .bindEvent({
            doubleclick: function(e) {
                if ($(e.target).is('.OxBar')) {
                    pandora.$ui.folders.animate({scrollTop: 0}, 250);
                }
            }
        });
    return that;
};

