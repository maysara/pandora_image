// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.leftPanel = function(section) {
    var that = Ox.SplitPanel({
            elements: [
                {
                    element: pandora.$ui.sectionbar = pandora.ui.sectionbar('buttons', section),
                    size: 24
                },
                {
                    element: pandora.$ui.folders = pandora.ui.folders(section)
                },
                {
                    collapsed: !pandora.user.ui.showInfo,
                    collapsible: true,
                    element: pandora.$ui.info = pandora.ui.info(),
                    size: pandora.getInfoHeight(true),
                    tooltip: Ox._('info') + ' <span class="OxBright">'
                        + Ox.SYMBOLS.SHIFT + 'I</span>'
                }
            ],
            id: 'leftPanel',
            orientation: 'vertical'
        })
        .bindEvent({
            resize: function(data) {
                pandora.user.ui.sidebarSize = data.size;
                var infoHeight = pandora.getInfoHeight(true);
                if (data.size < pandora.site.sectionButtonsWidth && pandora.$ui.sectionButtons) {
                    pandora.$ui.sectionButtons.remove();
                    delete pandora.$ui.sectionButtons;
                    pandora.$ui.sectionbar.append(pandora.$ui.sectionSelect = pandora.ui.sectionSelect(section));
                } else if (data.size >= pandora.site.sectionButtonsWidth && pandora.$ui.sectionSelect) {
                    pandora.$ui.sectionSelect.remove();
                    delete pandora.$ui.sectionSelect;
                    pandora.$ui.sectionbar.append(pandora.$ui.sectionButtons = pandora.ui.sectionButtons(section));
                }
                pandora.$ui.leftPanel.size(2, infoHeight);
                !pandora.user.ui.showInfo && pandora.$ui.leftPanel.css({bottom: -infoHeight + 'px'});
                pandora.resizeFolders();
                pandora.$ui.info.resizeInfo();                
            },
            resizeend: function(data) {
                // set to 0 so that UI.set registers a change of the value
                pandora.user.ui.sidebarSize = 0;
                pandora.UI.set({sidebarSize: data.size});
            },
            toggle: function(data) {
                pandora.UI.set({showSidebar: !data.collapsed});
                if (data.collapsed) {
                    Ox.forEach(pandora.$ui.folderList, function($list) {
                        $list.loseFocus();
                    });
                }
            },
            pandora_showinfo: function(data) {
                data.value == that.options('elements')[2].collapsed && that.toggle(2);
            }
        });
    return that;
};

