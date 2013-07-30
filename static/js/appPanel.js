// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.appPanel = function() {
    var that = Ox.SplitPanel({
            elements: [
                {
                    element: pandora.$ui.mainMenu = pandora.ui.mainMenu(),
                    size: 20
                },
                {
                    element: pandora.$ui.mainPanel = pandora.ui.mainPanel()
                }
            ],
            orientation: 'vertical'
        });
    setPage(pandora.user.ui.page);
    that.display = function() {
        // fixme: move animation into Ox.App
        var animate = $('.OxScreen').length == 0;
        Ox.Log('', 'ANIMATE?', animate)
        animate && pandora.$ui.body.css({opacity: 0});
        that.appendTo(pandora.$ui.body);
        animate && pandora.$ui.body.animate({opacity: 1}, 1000);
        return that;
    };
    that.reload = function() {
        Ox.Request.cancel();
        Ox.Request.clearCache();
        pandora.$ui.appPanel.remove();
        pandora.$ui.appPanel = pandora.ui.appPanel().appendTo(pandora.$ui.body);
        return that;
    };
    that.bindEvent({
        pandora_page: function(data) {
            setPage(data.value);
        }
    });
    function setPage(page) {
        var dialogPages = {
            site: pandora.site.sitePages.map(function(page) {
                return page.id;
            }).concat(['software']),
            account: ['signup', 'signin'],
            accountSignout: ['signout'],
            preferences: ['preferences'],
            help: ['help'],
            api: ['api']
        };
        if (page === '') {
            if (pandora.$ui.appPanel && pandora.$ui.home) {
                // unless we're on page load, remove home screen
                pandora.$ui.home.fadeOutScreen();
            }
            Ox.forEach(dialogPages, function(pages, dialog) {
                // close all dialogs
                if (pandora.$ui[dialog + 'Dialog']) {
                    pandora.$ui[dialog + 'Dialog'].close();
                }
            });
            if (pandora.$ui.tv) {
                pandora.$ui.tv.fadeOutScreen();
            }
        } else if (page == 'home') {
            if (pandora.$ui.appPanel) {
                // unless we're on page load, show home screen
                pandora.$ui.home = pandora.ui.home().fadeInScreen();
            }
        } else if (page == 'tv') {
            // if we're on page load, show tv immediately
            pandora.$ui.tv = pandora.ui.tv()[
                !pandora.$ui.appPanel ? 'showScreen' : 'fadeInScreen'
            ]();
            pandora.$ui.home && pandora.$ui.tv.mute();
        } else {
            // open dialog
            Ox.forEach(dialogPages, function(pages, dialog) {
                // close all other dialogs
                if (pages.indexOf(page) == -1 && pandora.$ui[dialog + 'Dialog']) {
                    pandora.$ui[dialog + 'Dialog'].close();
                }
            });
            if (Ox.getIndexById(pandora.site.sitePages, page) > -1 || page == 'software') {
                if (pandora.$ui.siteDialog && pandora.$ui.siteDialog.is(':visible')) {
                    pandora.$ui.siteDialog.select(page);
                } else {
                    pandora.$ui.siteDialog = pandora.ui.siteDialog(page).open();
                }
            } else if (['signup', 'signin'].indexOf(page) > -1) {
                if (pandora.user.level == 'guest') {
                    if (pandora.$ui.accountDialog && pandora.$ui.accountDialog.is(':visible')) {
                        pandora.$ui.accountDialog.options(pandora.ui.accountDialogOptions(page));
                    } else {
                        pandora.$ui.accountDialog = pandora.ui.accountDialog(page).open();
                    }
                } else {
                    pandora.UI.set({page: ''});
                }
            } else if (['preferences', 'signout'].indexOf(page) > -1) {
                if (pandora.user.level == 'guest') {
                    pandora.UI.set({page: ''});
                } else if (page == 'preferences') {
                    pandora.$ui.preferencesDialog = pandora.ui.preferencesDialog().open();
                } else {
                    pandora.ui.accountSignoutDialog().open();
                }
            } else if (page == 'help') {
                pandora.$ui.helpDialog = pandora.ui.helpDialog().open();
            } else if (page == 'api') {
                pandora.$ui.apiDialog = pandora.ui.apiDialog().open();
            }
        }
    }
    return that;
};

