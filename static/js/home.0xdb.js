// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.home = function() {

    var that = $('<div>')
            .addClass('OxScreen')
            .css({
                position: 'absolute',
                width: '100%',
                height: '100%',
                opacity: 0,
                zIndex: 1001
            }),

        $reflectionImage = $('<img>')
            .addClass('logo')
            .attr({src: '/static/png/logo.png'})
            .css({
                position: 'absolute',
                left: 0,
                top: '160px',
                right: 0,
                bottom: 0,
                width: '320px',
                margin: 'auto',
                opacity: 0,
                MozTransform: 'scaleY(-1)',
                OTransform: 'scaleY(-1)',
                WebkitTransform: 'scaleY(-1)'
            })
            .appendTo(that),

        $reflectionGradient = $('<div>')
            .addClass('OxReflection logo')
            .css({
                position: 'absolute',
                left: 0,
                top: '160px',
                right: 0,
                bottom: 0,
                // FIXME: should be 320 and 160 - the values below are temporary fixes for Chrome 26
                width: '322px',
                height: '162px',
                margin: 'auto',
            })
            .appendTo(that),

        $logo = $('<img>')
            .addClass('logo')
            .attr({
                id: 'logo',
                src: '/static/png/logo.png'
            })
            .css({
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                bottom: '160px',
                width: window.innerWidth + 'px',
                margin: 'auto',
                cursor: 'pointer'
            })
            .on({
                click: function() {
                    $browseButton.triggerEvent('click');
                }
            })
            .appendTo(that),

        $findInput = Ox.Input({
                width: 156
            })
            .css({
                position: 'absolute',
                left: 0,
                top: '48px',
                right: '164px',
                bottom: 0,
                margin: 'auto',
                opacity: 0
            })
            .click(function(e) {
                // fixme: why?
                e.stopPropagation();
            })
            .bindEvent({
                submit: function(data) {
                    if (data.value) {
                        $findButton.triggerEvent('click');
                    } else {
                        $browseButton.triggerEvent('click');
                    }
                }
            })
            .appendTo(that),

        $findButton = Ox.Button({
                title: Ox._('Find'),
                width: 74
            })
            .css({
                position: 'absolute',
                left: '82px',
                top: '48px',
                right: 0,
                bottom: 0,
                margin: 'auto',
                opacity: 0
            })
            .bindEvent({
                click: function() {
                    var folder = pandora.getListData().folder,
                        value = $findInput.value();
                    folder && pandora.$ui.folderList[folder].options({selected: []});
                    pandora.$ui.findSelect.value('*');
                    pandora.$ui.findInput.value(value);
                    that.fadeOutScreen();
                    pandora.UI.set({
                        page: '',
                        find: {
                            conditions: value === ''
                                ? []
                                : [{key: '*', value: value, operator: '='}],
                            operator: '&'
                        }
                    });
                }
            })
            .appendTo(that),

        $browseButton = Ox.Button({
                title: Ox._('Browse'),
                width: 74
            })
            .css({
                position: 'absolute',
                left: '246px',
                top: '48px',
                right: 0,
                bottom: 0,
                margin: 'auto',
                opacity: 0
            })
            .bindEvent({
                click: function() {
                    pandora.UI.set({
                        page: pandora.user.ui.page == 'home' ? '' : pandora.user.ui.page
                    });
                    that.fadeOutScreen();
                }
            })
            .appendTo(that),

        $signupButton = Ox.Button({
                title: Ox._('Sign Up'),
                width: 74
            })
            .css({
                position: 'absolute',
                left: 0,
                top: '112px',
                right: '246px',
                bottom: 0,
                margin: 'auto',
                opacity: 0
            })
            .bindEvent({
                click: function() {
                    pandora.UI.set({page: 'signup'});
                    that.fadeOutScreen();
                }
            }),

        $signinButton = Ox.Button({
                title: Ox._('Sign In'),
                width: 74
            })
            .css({
                position: 'absolute',
                left: 0,
                top: '112px',
                right: '82px',
                bottom: 0,
                margin: 'auto',
                opacity: 0
            })
            .bindEvent({
                click: function() {
                    pandora.UI.set({page :'signin'});
                    that.fadeOutScreen();
                }
            }),

        $preferencesButton = Ox.Button({
                title: Ox._('Preferences'),
                width: 156
            })
            .css({
                position: 'absolute',
                left: 0,
                top: '112px',
                right: '164px',
                bottom: 0,
                margin: 'auto',
                opacity: 0
            })
            .bindEvent({
                click: function() {
                    pandora.UI.set({page: 'preferences'});
                    that.fadeOutScreen();
                }
            }),

        $aboutButton = Ox.Button({
                title: Ox._('About {0}', [pandora.site.site.name]),
                width: 156
            })
            .css({
                position: 'absolute',
                left: '164px',
                top: '112px',
                right: 0,
                bottom: 0,
                margin: 'auto',
                opacity: 0
            })
            .bindEvent({
                click: function() {
                    pandora.UI.set({page: 'about'});
                    that.fadeOutScreen();
                }
            })
            .appendTo(that),

        $text = $('<div>')
            .addClass('OxSelectable')
            .css({
                position: 'absolute',
                left: 0,
                top: '176px',
                right: 0,
                bottom: 0,
                width: '360px',
                height: '16px',
                margin: 'auto',
                opacity: 0,
                textAlign: 'center'
            })
            .html(Ox._(
                'A Movie Database. \u2620 2007-{0} 0x2620. All Open Source.',
                [Ox.formatDate(new Date(), '%Y')]
            ))
            .appendTo(that);

    if (pandora.user.level == 'guest') {
        $signupButton.appendTo(that);
        $signinButton.appendTo(that);
    } else {
        $preferencesButton.appendTo(that);
    }

    that.fadeInScreen = function() {
        that.appendTo(Ox.UI.$body).animate({opacity: 1}, 500, function() {
            that.find(':not(#logo)').animate({opacity: 1}, 250, function() {
                $findInput.focusInput(true);
            });
        });
        $logo.animate({width: '320px'}, 500);
        return that;
    };

    that.fadeOutScreen = function() {
        that.find(':not(#logo)').hide();
        $logo.animate({width: window.innerWidth + 'px'}, 500);
        that.animate({opacity: 0}, 500, function() {
            that.remove();
        });
        pandora.$ui.tv && pandora.$ui.tv.unmute();
        return that;
    };

    that.hideScreen = function() {
        that.hide().remove();
        that.find(':not(#logo)').css({opacity: 0});
        $logo.css({width: window.innerWidth + 'px'});
        return that;
    };

    that.showScreen = function(callback) {
        var $elements = that.find(':not(.logo)'), count = 0;
        $logo.css({width: '320px'});
        that.css({opacity: 1}).appendTo(Ox.UI.$body);
        that.find('.logo').css({opacity: 1});
        $elements.animate({opacity: 1}, 500, function() {
            if (callback && ++count == $elements.length) {
                callback();
            }
        });
        $findInput.focusInput(true);
        return that;
    };

    return that;

};
