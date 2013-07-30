// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.home = function() {

    var self = {},

        that = $('<div>')
            .addClass('OxScreen')
            .css({
                position: 'absolute',
                width: '100%',
                height: '100%',
                opacity: 0,
                overflowY: 'auto',
                zIndex: 1001
            }),

        $box = $('<div>')
            .css({
                position: 'absolute',
                left: 0,
                top: '80px',
                right: 0,
                width: '560px',
                margin: '0 auto 0 auto'
            })
            .appendTo(that),

        $reflectionImage = $('<img>')
            .attr({src: '/static/png/logo.png'})
            .css({
                position: 'absolute',
                left: 0,
                top: '80px',
                right: 0,
                bottom: 0,
                width: '320px',
                margin: '0 auto 0 auto',
                MozTransform: 'scaleY(-1)',
                OTransform: 'scaleY(-1)',
                WebkitTransform: 'scaleY(-1)'
            })
            .appendTo($box),

        $reflectionGradient = $('<div>')
            .addClass('OxReflection')
            .css({
                position: 'absolute',
                left: 0,
                top: '80px',
                right: 0,
                width: '320px',
                height: '160px',
                margin: '0 auto 0 auto',
            })
            .appendTo($box),

        $logo = Ox.Element({
                element: '<img>',
                tooltip: Ox._('Enter {0}', [pandora.site.site.name])
            })
            .attr({
                id: 'logo',
                src: '/static/png/logo.png'
            })
            .css({
                position: 'absolute',
                left: 0,
                right: 0,
                width: '320px',
                margin: '0 auto 0 auto',
                cursor: 'pointer'
            })
            .bindEvent({
                anyclick: function() {
                    $browseButton.triggerEvent('click');
                }
            })
            .appendTo($box),

        $findInput = Ox.Input({
                width: 252
            })
            .css({
                position: 'absolute',
                left: 0,
                top: '104px',
                right: '260px',
                bottom: 0,
                margin: '0 auto 0 auto',
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
            .appendTo($box),

        $findButton = Ox.Button({
                title: Ox._('Find'),
                width: 122
            })
            .css({
                position: 'absolute',
                left: '130px',
                top: '104px',
                right: 0,
                bottom: 0,
                margin: '0 auto 0 auto',
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
            .appendTo($box),

        $browseButton = Ox.Button({
                title: Ox._('Browse'),
                width: 122
            })
            .css({
                position: 'absolute',
                left: '390px',
                top: '104px',
                right: 0,
                bottom: 0,
                margin: '0 auto 0 auto',
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
            .appendTo($box),

        $signupButton = Ox.Button({
                title: Ox._('Sign Up'),
                width: 122
            })
            .css({
                position: 'absolute',
                left: 0,
                top: '144px',
                right: '390px',
                bottom: 0,
                margin: '0 auto 0 auto',
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
                width: 122
            })
            .css({
                position: 'absolute',
                left: 0,
                top: '144px',
                right: '130px',
                bottom: 0,
                margin: '0 auto 0 auto',
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
                width: 252
            })
            .css({
                position: 'absolute',
                left: 0,
                top: '144px',
                right: '260px',
                bottom: 0,
                margin: '0 auto 0 auto',
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
                width: 252
            })
            .css({
                position: 'absolute',
                left: '260px',
                top: '144px',
                right: 0,
                bottom: 0,
                margin: '0 auto 0 auto',
                opacity: 0
            })
            .bindEvent({
                click: function() {
                    pandora.UI.set({page: 'about'});
                    that.fadeOutScreen();
                }
            })
            .appendTo($box),

        $features = $('<div>')
            .attr({id: 'lists'})
            .css({
                position: 'absolute',
                left: 0,
                top: '184px',
                right: 0,
                bottom: 0,
                width: '560px',
                margin: '0 auto 0 auto',
                opacity: 0
            })
            .appendTo($box);

    if (pandora.user.level == 'guest') {
        $signupButton.appendTo($box);
        $signinButton.appendTo($box);
    } else {
        $preferencesButton.appendTo($box);
    }

    function showFeatures() {
        var $space,
            featured = {},
            find = {
                query: {
                    conditions: [{key: 'status', value: 'featured', operator: '=='}],
                    operator: '&'
                },
                keys: ['description', 'modified', 'name', 'user'],
                sort: [{key: 'position', operator: '+'}]
            },
            items, lists, texts;
        pandora.api.findLists(find, function(result) {
            lists = result.data.items.length;
            items = result.data.items.map(function(item) {
                return Ox.extend(item, {type: 'list'});
            });
            pandora.api.findTexts(find, function(result) {
                texts = result.data.items.length
                items = items.concat(result.data.items.map(function(item) {
                    return Ox.extend(item, {type: 'text'});
                }));
                $features.empty();
                show();
                return;
                if (featured.lists.length) {
                    top += 24;
                }
                show('texts');
            });
        });
        function show() {
            var counter = 0, max = 8, mouse = false, position = 0, selected = 0,
                color = Ox.Theme() == 'oxlight' ? 'rgb(0, 0, 0)'
                    : Ox.Theme() == 'oxmedium' ? 'rgb(0, 0, 0)'
                    : 'rgb(255, 255, 255)',
                $label, $icon, $text,
                $featuresBox, $featuresContainer, $featuresContent,
                $featureBox = [], $featureIcon = [],
                $previousButton, $nextButton;
            if (items.length) {
                $label = Ox.Label({
                        textAlign: 'center',
                        title: '<b>' + Ox._('Featured ' + (
                            lists == 1 && texts == 0 ? 'List'
                            : lists == 0 && texts == 1 ? 'Text'
                            : texts == 0 ? 'Lists'
                            : lists == 0 ? 'Texts'
                            : 'Lists and Texts'
                        )) + '</b>',
                        width: 512
                    })
                    .css({
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        margin: '0 auto 0 auto'
                    })
                    .appendTo($features);
                $text = Ox.Label({
                        width: 386
                    })
                    .addClass('OxSelectable')
                    .css({
                        position: 'absolute',
                        left: '24px',
                        top: '24px',
                        right: 0,
                        height: '104px',
                        borderTopLeftRadius: '32px',
                        borderBottomLeftRadius: '32px',
                        padding: '8px 8px 8px 130px',
                        overflowY: 'auto',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'normal'
                    })
                    .html(
                        getHTML(items[selected])
                    )
                    .appendTo($features);
                pandora.createLinks($text);
                $icon = Ox.Element({
                        element: '<img>',
                        tooltip: getTooltip(items[selected])
                    })
                    .attr({
                        src: getImageURL(items[selected])
                    })
                    .css({
                        position: 'absolute',
                        left: 0,
                        top: '24px',
                        right: '390px',
                        width: '122px',
                        height: '122px',
                        borderRadius: '32px',
                        margin: '0 auto 0 auto',
                        cursor: 'pointer'
                    })
                    .bindEvent({
                        anyclick: function() {
                            openItem(selected);
                        }
                    })
                    .appendTo($features);
                if (items.length > 1) {
                    $featuresBox = $('<div>')
                        .css({
                            position: 'absolute',
                            left: 0,
                            top: '150px',
                            right: 0,
                            height: '65px', // 4+57+4
                            width: '560px', // 16+8+512+8+16
                            margin: '0 auto 0 auto'
                        })
                        .appendTo($features);
                    $featuresContainer = $('<div>')
                        .css({
                            position: 'absolute',
                            left: '20px',
                            right: '20px',
                            height: '65px',
                            width: '520px',
                            overflow: 'hidden'
                        })
                        .appendTo($featuresBox);
                    $featuresContent = $('<div>')
                        .css({
                            position: 'absolute',
                            width: items.length * 65 + 'px',
                            height: '65px',
                            marginLeft: items.length < max
                                ? (max - items.length) * 65 / 2 + 'px'
                                : 0
                        })
                        .appendTo($featuresContainer);
                    if (items.length > max) {
                        $previousButton = Ox.Button({
                                title: 'left',
                                type: 'image'
                            })
                            .addClass(position > 0 ? 'visible' : '')
                            .css({
                                position: 'absolute',
                                left: 0,
                                top: '25px',
                                opacity: 0
                            })
                            .hide()
                            .bindEvent({
                                mousedown: function() {
                                    counter = 0;
                                    scrollToPosition(position - 1, true);
                                },
                                mouserepeat: function() {
                                    // fixme: arbitrary
                                    if (counter++ % 5 == 0) {
                                        scrollToPosition(position - 1, false);
                                    }
                                }
                            })
                            .appendTo($featuresBox);
                        $nextButton = Ox.Button({
                                title: 'right',
                                type: 'image'
                            })
                            .addClass(position < items.length - 1 ? 'visible' : '')
                            .css({
                                position: 'absolute',
                                right: 0,
                                top: '25px',
                                opacity: 0
                            })
                            .hide()
                            .bindEvent({
                                mousedown: function() {
                                    counter = 0;
                                    scrollToPosition(position + 1, true);
                                },
                                mouserepeat: function() {
                                    // fixme: arbitrary
                                    if (counter++ % 5 == 0) {
                                        scrollToPosition(position + 1, false);
                                    }
                                }
                            })
                            .appendTo($featuresBox);
                        $featuresBox.on({
                            mouseenter: function() {
                                mouse = true;
                                $('.visible').show().stop().animate({
                                    opacity: 1
                                }, 250);
                            },
                            mouseleave: function() {
                                mouse = false;
                                $('.visible').stop().animate({
                                    opacity: 0
                                }, 250, function() {
                                    $(this).hide();
                                });
                            },
                            mousewheel: function(e, delta, deltaX, deltaY) {
                                Ox.print('mwd', deltaX);
                                // fixme: arbitrary
                                scrollToPosition(position + Math.round(deltaX * 2), true);
                            }
                        });
                    }
                    items.forEach(function(item, i) {
                        $featureBox[i] = $('<div>')
                            .css({
                                float: 'left',
                                width: '57px',
                                height: '57px',
                                padding: '2px',
                                margin: '2px',
                                borderRadius: '16px',
                                boxShadow: '0 0 2px ' + (i == selected ? color : 'transparent')
                            })
                            .appendTo($featuresContent);
                        $featureIcon[i] = Ox.Element({
                                element: '<img>',
                                tooltip: (lists && texts ? Ox._(Ox.toTitleCase(item.type)) + ': ' : '')
                                    + Ox.encodeHTMLEntities(item.name)
                            })
                            .attr({
                                src: getImageURL(item)
                            })
                            .css({
                                width: '57px',
                                height: '57px',
                                borderRadius: '16px',
                                cursor: 'pointer'
                            })
                            .bindEvent({
                                doubleclick: function() {
                                    openItem(i);
                                },
                                singleclick: function() {
                                    selectItem(i);
                                }
                            })
                            .appendTo($featureBox[i]);
                    });
                    self.keydown = function(e) {
                        var focused = Ox.Focus.focused(),
                            key = Ox.KEYS[e.keyCode];
                        if (
                            focused === null
                            || !Ox.UI.elements[focused].hasClass('OxInput')
                        ) {
                            if (key == 'left' && selected > 0) {
                                selectItem(selected - 1);
                            } else if (key == 'up' && selected > 0) {
                                selectItem(0);
                            } else if (key == 'right' && selected < items.length - 1) {
                                selectItem(selected + 1);
                            } else if (key == 'down' && selected < items.length - 1) {
                                selectItem(items.length - 1);
                            }
                        }
                    };
                    Ox.$document.on({keydown: self.keydown});
                }
                $space = $('<div>')
                    .css({
                        position: 'absolute',
                        top: items.length == 0 ? '0px'
                            : items.length == 1 ? '150px'
                            : '215px',
                        width: '560px',
                        height: '80px'
                    })
                    .appendTo($features);
                $features.animate({opacity: 1}, 250);
            }

            function getHTML(item) {
                return '<b>'
                    + (lists && texts ? Ox._(Ox.toTitleCase(item.type)) + ': ' : '')
                    + Ox.encodeHTMLEntities(item.name) + '</b><br><br>'
                    + item.description;
            }

            function getImageURL(item) {
                return '/' + item.type + '/' + item.user
                    + ':' + item.name + '/icon256.jpg?' + item.modified;
            }

            function getTooltip(item) {
                return Ox._('View {0}', [Ox._(Ox.toTitleCase(item.type))])
            }

            function openItem(i) {
                that.fadeOutScreen();
                pandora.UI.set(Ox.extend({
                    section: items[i].type == 'list' ? 'items' : 'texts',
                    page: ''
                }, items[i].type == 'list' ? {
                    find: {
                        conditions: [{
                            key: 'list',
                            value: items[i].user + ':'
                                + items[i].name,
                            operator: '=='
                        }],
                        operator: '&'
                    }
                } : {
                    text: items[i].user + ':' + items[i].name
                }));
            }

            function scrollToPosition(i, animate) {
                if (i >= 0 && i <= items.length - max && i != position) {
                    position = i;
                    $featuresContent.stop().animate({
                        left: (position * -65) + 'px'
                    }, animate ? 250 : 0, function() {
                        if (position == 0) {
                            $previousButton.removeClass('visible').stop().animate({
                                opacity: 0
                            }, 250, function() {
                                $previousButton.hide();
                            });
                        } else {
                            $previousButton.addClass('visible');
                        }
                        if (position == items.length - max) {
                            $nextButton.removeClass('visible').stop().animate({
                                opacity: 0
                            }, 250, function() {
                                $nextButton.hide();
                            });
                        } else {
                            $nextButton.addClass('visible');
                        }
                        if (mouse) {
                            $featuresBox.trigger('mouseenter');
                        }
                    });
                }
            }

            function selectItem(i) {
                if (i >= 0 && i <= items.length - 1 && i != selected) {
                    $featureBox[selected].css({
                        boxShadow: 'none'
                    });
                    selected = i;
                    $featureBox[selected].css({
                        boxShadow: '0 0 2px ' + color
                    });
                    if (selected < position) {
                        scrollToPosition(selected, true);
                    } else if (selected > position + max - 1) {
                        scrollToPosition(selected - max + 1, true);
                    }
                    $icon.attr({
                        src: getImageURL(items[selected])
                    }).options({
                        tooltip: getTooltip(items[selected])
                    });
                    $text.html(
                        getHTML(items[selected])
                    );
                }
            }

        }        
    }

    that.fadeInScreen = function() {
        that.appendTo(Ox.UI.$body).animate({opacity: 1}, 500, function() {
            that.find('*').animate({opacity: 1}, 250, function() {
                $findInput.focusInput(true);
                showFeatures();
            });
        });
        return that;
    };

    that.fadeOutScreen = function() {
        $('.OxTooltip').remove();
        that.animate({opacity: 0}, 500, function() {
            that.remove();
        });
        pandora.$ui.tv && pandora.$ui.tv.unmute();
        self.keydown && Ox.$document.off({keydown: self.keydown});
        return that;
    };

    that.showScreen = function(callback) {
        var $elements = that.find('*'), count = 0;
        $box.css({top: window.innerHeight / 2 - 80 + 'px'});
        that.css({opacity: 1}).appendTo(Ox.UI.$body);
        $findInput.focusInput(true);
        $box.animate({top: '80px'}, 500, function() {
            $elements.animate({opacity: 1}, 250, function() {
                if (++count == $elements.length) {
                    showFeatures();
                    callback && callback();
                }
            });
        });
        return that;
    };

    return that;

};
