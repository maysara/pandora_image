'use strict';

// FIXME: rename to embedView

pandora.ui.embedPanel = function() {

    var that,
        ui = pandora.user.ui,
        view = !ui.item ? ui.listView : ui.itemView;

    if (ui.section != 'texts' && !ui.page) {
        if (!ui.item) {
            if (Ox.contains(['grid', 'clip'], view)) {
                that = pandora.ui.embedError(true);
            } else if (view == 'video') {
                that = pandora.ui.videoView(true);
            } else if (Ox.contains(['map', 'calendar'], view)) {
                that = pandora.ui.embedNavigation(view);
            }
        } else {
            if (view == 'info') {
                that = pandora.ui.embedError(true);
            } else if (Ox.contains(['player', 'editor'], view)) {
                that = pandora.ui.embedPlayer();
            } else if (view == 'timeline') {
                that = pandora.ui.embedError(true);
            } else if (view == 'clips') {
                that = pandora.ui.embedError(true);
            } else if (Ox.contains(['map', 'calendar'], view)) {
                that = pandora.ui.embedNavigation(view);
            }
        }
    }
    if (!that) {
        that = pandora.ui.embedError();
    }

    that.display = function() {
        // fixme: move animation into Ox.App
        var animate = $('.OxScreen').length == 0;
        Ox.Log('', 'ANIMATE?', animate)
        animate && pandora.$ui.body.css({opacity: 0});
        that.appendTo(pandora.$ui.body);
        animate && pandora.$ui.body.animate({opacity: 1}, 1000);
        return that;
    };

    that.reloadPanel = function() {
        that.setElement(pandora.$ui.embedPanel = pandora.ui.embedPanel());
        return that;
    };

    that.bindEvent({
        pandora_item: that.reloadPanel,
        pandora_itemview: that.reloadPanel,
        pandora_videopoints: that.reloadPanel,
        pandora_hash: that.reloadPanel
    });

    return that;

};
