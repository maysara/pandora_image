// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

/*
---- UI Tree ----
appPanel
    mainMenu
    mainPanel
        leftPanel
            sectionbar
            folders
            info
        rightPanel
            toolbar
            contentPanel
                browser <-- should be filters or browser
                list or item
            statusbar <-- make part of content panel
*/

(function() {

    window.onerror = function(error, url, line) {
        try {
            !isMSIE && pandora.api.log({
                text: error,
                url: url,
                line: line
            });
        } catch(e) {}
    };

    // handle legacy embed and print URLs
    document.location.hash = document.location.hash.replace(
        /^#(embed|print)=true(&)?/,
        function() {
            return '#' + arguments[1] + (arguments[2] ? '?' : '');
        }
    );

    var animationInterval,
        enableDebugMode = getLocalStorage('pandora.enableDebugMode'),
        enableEventLogging = getLocalStorage('pandora.enableEventLogging'),
        isEmbed = /^#embed(\?.*?)?$/.test(document.location.hash),
        isMSIE = /MSIE/.test(navigator.userAgent),
        isPrint = /^#print(\?.*?)?$/.test(document.location.hash),
        legacyThemes = {classic: 'oxlight', modern: 'oxdark'},
        theme = getLocalStorage('Ox.theme')
            && JSON.parse(localStorage['Ox.theme']) || 'oxmedium';

    theme = legacyThemes[theme] || theme;

    loadImages(function(images) {
        loadScreen(images);
        loadOxJS(function() {
            loadOxUI(loadPandora);
        });
    });

    function getLocalStorage(key) {
        // fails if localStorage does not exist or if third party cookies are
        // disabled
        try {
            return localStorage[key];
        } catch(e) {}
    }

    function getPandoraVersion() {
        var i, path, scripts = document.getElementsByTagName('script');
        for (i = 0;i < scripts.length; i++) {
            if(/pandora.js/.test(scripts[i].src)) {
                return scripts[1].src.replace(/.*\?/, '');
            }
        }
    }

    function loadImages(callback) {
        // Opera doesn't fire onload for SVGs,
        // so we only wait for the PNG to load.
        var images = {};
        images.logo = document.createElement('img');
        images.logo.onload = function() {
            var ratio = images.logo.width / images.logo.height,
                width = isEmbed || isPrint ? 96 : 320,
                height = width / ratio;
            images.logo.style.position = 'absolute';
            images.logo.style.left = 0;
            images.logo.style.top = 0;
            images.logo.style.right = 0;
            images.logo.style.bottom = height + 'px';
            images.logo.style.width = width + 'px';
            images.logo.style.height = height + 'px';
            images.logo.style.margin = 'auto';
            if (!isMSIE) {
                images.reflection = document.createElement('img');
                images.reflection.style.position = 'absolute';
                images.reflection.style.left = 0;
                images.reflection.style.top = height + 'px';
                images.reflection.style.right = 0;
                images.reflection.style.bottom = 0;
                images.reflection.style.width = width + 'px';
                images.reflection.style.height = height + 'px';
                images.reflection.style.margin = 'auto';
                images.reflection.style.MozTransform = 'scaleY(-1)';
                images.reflection.style.MSTransform = 'scaleY(-1)';
                images.reflection.style.OTransform = 'scaleY(-1)';
                images.reflection.style.WebkitTransform = 'scaleY(-1)';
                images.reflection.src = '/static/png/logo.png';
            }
            images.loadingIcon = document.createElement('img');
            images.loadingIcon.setAttribute('id', 'loadingIcon');
            images.loadingIcon.style.position = 'absolute';
            images.loadingIcon.style.left = 0;
            images.loadingIcon.style.top = isEmbed || isPrint ? '32px' : '80px';
            images.loadingIcon.style.right = 0;
            images.loadingIcon.style.bottom = 0;
            images.loadingIcon.style.width = isEmbed || isPrint ? '16px' : '32px';
            images.loadingIcon.style.height = isEmbed || isPrint ? '16px' : '32px';
            images.loadingIcon.style.margin = 'auto';
            images.loadingIcon.src = '/static/oxjs/' + (enableDebugMode ? 'dev' : 'build')
                + '/Ox.UI/themes/' + theme + '/svg/symbolLoading.svg';
            callback(images);
        };
        images.logo.src = '/static/png/logo.png';
    }

    function loadScreen(images) {
        
        if (!isMSIE) {
            var gradient = document.createElement('div');
            gradient.style.position = 'absolute';
            gradient.style.left = 0;
            gradient.style.top = isEmbed || isPrint ? '48px' : '160px';
            gradient.style.right = 0;
            gradient.style.bottom = 0;
            // FIXME: should be 320 and 160 - the values below are temporary fixes for Chrome 26
            gradient.style.width = isEmbed || isPrint ? '98px' : '322px';
            gradient.style.height = isEmbed || isPrint ? '50px' : '162px';
            gradient.style.margin = 'auto';
            gradient.style.background = theme == 'oxlight' ? '-moz-linear-gradient(top, rgba(224, 224, 224, 0.75), rgba(224, 224, 224, 1), rgba(224, 224, 224, 1))'
                : theme == 'oxmedium' ? '-moz-linear-gradient(top, rgba(144, 144, 144, 0.75), rgba(144, 144, 144, 1), rgba(144, 144, 144, 1))'
                : '-moz-linear-gradient(top, rgba(32, 32, 32, 0.75), rgba(32, 32, 32, 1), rgba(32, 32, 32, 1))';
            gradient.style.background = theme == 'oxlight' ? '-o-linear-gradient(top, rgba(224, 224, 224, 0.75), rgba(224, 224, 224, 1), rgba(224, 224, 224, 1))'
                : theme == 'oxmedium' ? '-o-linear-gradient(top, rgba(144, 144, 144, 0.75), rgba(144, 144, 144, 1), rgba(144, 144, 144, 1))'
                : '-o-linear-gradient(top, rgba(32, 32, 32, 0.75), rgba(32, 32, 32, 1), rgba(32, 32, 32, 1))';
            gradient.style.background = theme == 'oxlight' ? '-webkit-linear-gradient(top, rgba(224, 224, 224, 0.75), rgba(224, 224, 224, 1), rgba(224, 224, 224, 1))'
                : theme == 'oxmedium' ? '-webkit-linear-gradient(top, rgba(144, 144, 144, 0.75), rgba(144, 144, 144, 1), rgba(144, 144, 144, 1))'
                : '-webkit-linear-gradient(top, rgba(32, 32, 32, 0.75), rgba(32, 32, 32, 1), rgba(32, 32, 32, 1))';
        }
        var loadingScreen = document.createElement('div');
        loadingScreen.setAttribute('id', 'loadingScreen');
        loadingScreen.className = 'OxScreen';
        loadingScreen.style.position = 'absolute';
        loadingScreen.style.width = '100%';
        loadingScreen.style.height = '100%';
        loadingScreen.style.backgroundColor = theme == 'oxlight' ? 'rgb(224, 224, 224)'
            : theme == 'oxmedium' ? 'rgb(144, 144, 144)' : 'rgb(32, 32, 32)';
        loadingScreen.style.zIndex = '1002';
        loadingScreen.appendChild(images.logo);
        images.reflection && loadingScreen.appendChild(images.reflection);
        gradient && loadingScreen.appendChild(gradient);
        loadingScreen.appendChild(images.loadingIcon);

        // FF3.6 document.body can be undefined here
        window.onload = function() {
            document.body.style.margin = 0;
            document.body.appendChild(loadingScreen);
            startAnimation();
        };
        // IE8 does not call onload if already loaded before set
        document.body && window.onload();

    }

    function loadOxJS(callback) {
        var head = document.head
                || document.getElementsByTagName('head')[0]
                || document.documentElement, 
            script = document.createElement('script');
        if (isMSIE) {
            // fixme: find a way to check if css/js have loaded in msie
            setTimeout(callback, 2500);
        } else {
            script.onload = callback;
        }
        script.src = '/static/oxjs/' + (enableDebugMode ? 'dev' : 'build') + '/Ox.js?' + getPandoraVersion();
        script.type = 'text/javascript';
        head.appendChild(script);
    }

    function loadOxUI(callback) {
        Ox.load({
            UI: {theme: theme},
            Geo: {}
        }, callback);
    }

    function loadPandora(browserSupported) {
        window.pandora = Ox.App({
            name: 'pandora',
            url: '/api/'
        }).bindEvent({
            load: function(data) {
                data.browserSupported = browserSupported;
                Ox.extend(pandora, {
                    requests: {},
                    ui: {}
                });
                loadPandoraFiles(function() {
                    enableEventLogging && Ox.Event.bind(pandora.logEvent);
                    initPandora(data);
                    if (pandora.localStorage('local')) {
                        var url = pandora.localStorage('local');
                        window.pandora.local = Ox.API({
                            url: url + '/api/'
                        }, function() {
                            pandora.site.site.videoprefix = url;
                        });
                    }
                });
            }
        });
    }

    function loadPandoraFiles(callback) {
        var prefix = '/static/';
        if (enableDebugMode) {
            Ox.getJSON(prefix + 'json/pandora.json?' + Ox.random(1000), function(files) {
                Ox.getFile(files.map(function(file) {
                    return prefix + file;
                }), callback);
            });
        } else {
            Ox.getFile(prefix + 'js/pandora.min.js', callback);
        }
    }

    function initPandora(data) {

        Ox.Log('', 'Ox.App load', data);
        Ox.extend(pandora, {
            $ui: {
                body: $('body'),
                document: $(document),
                window: $(window)
                    .on({
                        beforeunload: pandora.beforeUnloadWindow,
                        resize: pandora.resizeWindow,
                        unload: pandora.unloadWindow
                    })
            },
            site: data.site,
            user: data.user
        });
        // make sure all valid ui settings are present
        pandora.user.ui = Ox.extend(
            Ox.clone(pandora.site.user.ui), pandora.user.ui
        );
        // make sure no invalid ui settings are present
        Object.keys(pandora.user.ui).forEach(function(key) {
            if (Ox.isUndefined(pandora.site.user.ui[key])) {
                delete pandora.user.ui[key];
            }
        });
        // patch theme ... this can be removed at a later point
        pandora.user.ui.theme = legacyThemes[pandora.user.ui.theme] || pandora.user.ui.theme;
        // make sure theme is valid
        if (!Ox.contains(pandora.site.themes, pandora.user.ui.theme)) {
            pandora.user.ui.theme = pandora.site.user.ui.theme;
        }
        // patch itemView ... this can be removed at a later point
        if (pandora.user.ui.itemView == 'video') {
            pandora.user.ui.itemView = 'player';
        }

        Ox.extend(pandora.site, {
            calendar: data.site.layers.some(function(layer) {
                return layer.type == 'event'
            }) ? 'manual' : data.site.layers.some(function(layer) {
                return layer.hasEvents;
            }) ? 'auto' : 'none',
            clipKeys: data.site.clipKeys.map(function(key) {
                return Ox.extend(key, {
                    operator: pandora.getSortOperator(key.id)
                });
            }),
            findKeys: data.site.itemKeys.filter(function(key) {
                return key.find;
            }),
            itemsSection: pandora.site.itemName.plural.toLowerCase(),
            map: data.site.layers.some(function(layer) {
                return layer.type == 'place'
            }) ? 'manual' : data.site.layers.some(function(layer) {
                return layer.hasPlaces;
            }) ? 'auto' : 'none',
            sectionFolders: {
                items: [
                    {id: 'personal', title: 'Personal Lists'},
                    {id: 'favorite', title: 'Favorite Lists', showBrowser: false},
                    {id: 'featured', title: 'Featured Lists', showBrowser: false},
                    {id: 'volumes', title: 'Local Volumes'}
                ],
                edits: [
                    {id: 'personal', title: 'Personal Edits'},
                    {id: 'favorite', title: 'Favorite Edits', showBrowser: false},
                    {id: 'featured', title: 'Featured Edits', showBrowser: false}
                ],
                texts: [
                    {id: 'personal', title: 'Personal Texts'},
                    {id: 'favorite', title: 'Favorite Texts', showBrowser: false},
                    {id: 'featured', title: 'Featured Texts', showBrowser: false}
                ]
            },
            sortKeys: pandora.getSortKeys()
        });
        pandora.site.listSettings = {};
        Ox.forEach(pandora.site.user.ui, function(val, key) {
            if (/^list[A-Z]/.test(key)) {
                pandora.site.listSettings[key] = key[4].toLowerCase() + key.slice(5);
            }
        });

        Ox.extend(pandora.user, {
            sectionElement: 'buttons',
            videoFormat: Ox.getVideoFormat(pandora.site.video.formats)
        });

        // set locale and initialize url controller
        // data.locale is prefered language according to http header
        //pandora.setLocale(pandora.user.ui.locale || data.locale, function() {
        pandora.setLocale(pandora.user.ui.locale, function() {
            pandora.URL.init().parse(function() {
                var isHome = Ox.contains(['/', '/home'], document.location.pathname);
                if (data.browserSupported) {
                    stopAnimation();
                    $('#loadingScreen').remove();
                } else {
                    loadBrowserMessage();
                }
                Ox.Theme(pandora.user.ui.theme);
                if (isEmbed) {
                    pandora.$ui.embedPanel = pandora.ui.embedPanel().display();
                    Ox.$parent.onMessage({
                        settheme: function(data) {
                            if (Ox.contains(pandora.site.themes, data.theme)) {
                                Ox.Theme(data.theme);
                            }
                        },
                        seturl: function(data) {
                            if (pandora.isEmbedURL(data.url)) {
                                pandora.URL.push(data.url);
                            }
                        }
                    });
                } else if (isPrint) {
                    pandora.$ui.printView = pandora.ui.printView().display();
                } else if (isHome) {
                    pandora.$ui.home = pandora.ui.home().showScreen(initPandoraApp);
                } else {
                    initPandoraApp();
                }
            });
        });

    }

    function initPandoraApp() {
        pandora.$ui.appPanel = pandora.ui.appPanel().display();
        pandora.$ui.loadingIcon.update(Ox.Request.requests());
        Ox.Request.bindEvent({
            error: pandora.ui.errorDialog,
            request: function(data) {
                pandora.$ui.loadingIcon.update(data.requests);
            }
        });
        pandora.site.sectionButtonsWidth = pandora.$ui.sectionButtons.width() + 8;
        if (getLocalStorage('pandora.onload')) {
            try {
                eval(localStorage['pandora.onload'])
            } catch(e) {}
        }
    }

    function loadBrowserMessage() {
        var browsers = [].concat(
                isMSIE ? [{name: 'Chrome Frame', url: 'http://google.com/chromeframe/'}] : [],
                [
                    {name: 'Chrome', url: 'http://google.com/chrome/'},
                    {name: 'Firefox', url: 'http://mozilla.org/firefox/'},
                    {name: 'Safari', url: 'http://apple.com/safari/'}
                ]
            ),
            images = browsers.map(function(browser) {
                return Ox.PATH + 'Ox.UI/png/browser' + browser.name.replace(' ', '') + '128.png';
            }),
            $loadingScreen = $('#loadingScreen');
        Ox.getFile(images, function() {
            var html = pandora.site.site.name
                    + ' requires an up-to-date web browser. Please take a moment to '
                    + (
                        isMSIE
                        ? 'install <a href="' + browsers[0].url + '">' + browsers[0].name + '</a> or '
                        : ''
                    )
                    + 'download ' + browsers.filter(function(browser) {
                        return browser.name != 'Chrome Frame';
                    }).map(function(browser, i) {
                        return '<a href="' + browser.url + '">' + browser.name + '</a>'
                            + (i == 0 ? ', ' : i == 1 ? ' or ' : '');
                    }).join('')
                    + '. Otherwise, <a href="javascript:pandora.proceed()">proceed</a> at your own risk.',
                $message = $('<div>')
                    .css({
                        position: 'absolute',
                        left: 0,
                        top: '160px',
                        right: 0,
                        bottom: 0,
                        width: '320px',
                        height: '160px',
                        margin: 'auto'
                    }),
                $images = $('<div>')
                    .css({
                        margin: '12px',
                        textAlign: 'center'
                    })
                    .appendTo($message);
            stopAnimation();
            $('#loadingIcon').remove();
            $message.appendTo($loadingScreen);
            browsers.forEach(function(browser) {
                $('<a>')
                    .attr({
                        href: browser.url,
                        title: browser.name
                    })
                    .append(
                        $('<img>')
                            .attr({
                                src: Ox.PATH + 'Ox.UI/png/browser' + browser.name.replace(' ', '') + '128.png'
                            })
                            .css({width: '32px', height: '32px', border: 0, margin: '4px'})
                    )
                    .appendTo($images);
            });
            $('<div>')
                .css({
                    textAlign: 'center'
                })
                .html(html)
                .appendTo($message);
        });

        pandora.proceed = function() {
            $loadingScreen.animate({
                opacity: 0
            }, 1000, function() {
                $loadingScreen.remove();
            });
        }

    }

    function startAnimation() {
        var css, deg = 0, loadingIcon = document.getElementById('loadingIcon'),
            previousTime = +new Date();
        animationInterval = setInterval(function() {
            var currentTime = +new Date(),
                delta = (currentTime - previousTime) / 1000;
            previousTime = currentTime;
            deg = Math.round((deg + delta * 360) % 360 / 30) * 30;
            css = 'rotate(' + deg + 'deg)';
            loadingIcon.style.MozTransform = css;
            loadingIcon.style.MSTransform = css;
            loadingIcon.style.OTransform = css;
            loadingIcon.style.WebkitTransform = css;
        }, 83);
    }

    function stopAnimation() {
        clearInterval(animationInterval);
    }

}());
