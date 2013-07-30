'use strict';

pandora.ui.embedNavigation = function(type) {

    var that = pandora.ui.navigationView(type, pandora.site.video.previewRatio);

    that.resizePanel = function() {
        pandora.$ui.map.resizeMap();
        return that;
    };

    return that;

};