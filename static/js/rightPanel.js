// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.rightPanel = function() {
    var that = Ox.SplitPanel({
            elements: [
                {
                    element: pandora.$ui.toolbar = pandora.ui.toolbar(),
                    size: 24
                },
                {
                    element: pandora.$ui.contentPanel = pandora.ui.contentPanel()
                }
            ],
            id: 'rightPanel',
            orientation: 'vertical'
        })
        .bindEvent({
            resize: function(data) {
                var clipsItems, previousClipsItems;
                if (!pandora.user.ui.item) {
                    pandora.resizeFilters();
                    pandora.$ui.list.size();
                    if (pandora.user.ui.listView == 'clips') {
                        clipsItems = pandora.getClipsItems();
                        previousClipsItems = pandora.getClipsItems(pandora.$ui.list.options('width'));
                        pandora.$ui.list.options({width: data.size});
                        if (clipsItems != previousClipsItems) {
                            Ox.Request.clearCache(); // fixme
                            pandora.$ui.list.reloadList(true);
                        }
                    } else if (pandora.user.ui.listView == 'timelines') {
                        pandora.$ui.list.options({width: data.size});
                    } else if (pandora.user.ui.listView == 'map') {
                        pandora.$ui.map.resizeMap();
                    } else if (pandora.user.ui.listView == 'calendar') {
                        pandora.$ui.calendar.resizeCalendar();
                    } else if (pandora.user.ui.listView == 'video') {
                        pandora.$ui.list.resize();
                    }
                } else {
                    pandora.$ui.browser.scrollToSelection();
                    if (pandora.user.ui.itemView == 'clips') {
                        pandora.$ui.clipList.size();
                    } else if (pandora.user.ui.itemView == 'timeline') {
                        pandora.$ui.timeline.options({width: data.size});
                    } else if (pandora.user.ui.itemView == 'player') {
                        pandora.$ui.player.options({width: data.size});
                    } else if (pandora.user.ui.itemView == 'editor') {
                        pandora.$ui.editor.options({width: data.size});
                    } else if (pandora.user.ui.listView == 'map') {
                        pandora.$ui.map.resizeMap();
                    } else if (pandora.user.ui.listView == 'calendar') {
                        pandora.$ui.calendar.resizeCalendar();
                    } else if (pandora.user.ui.listView == 'video') {
                        pandora.$ui.list.size();
                    }
                }
            }
        });
    return that;
};

