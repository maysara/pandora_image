// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.folderBrowser = function(id, section) {
    var that = Ox.SplitPanel({
        elements: [
            {
                element: pandora.ui.folderBrowserBar(id, section),
                size: 24
            },
            {
                element: pandora.$ui.folderList[id] = pandora.ui.folderBrowserList(id, section)
            }
        ],
        orientation: 'vertical'
    });
    return that;
};

