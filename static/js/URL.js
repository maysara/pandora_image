// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.URL = (function() {

    var self = {}, that = {};

    // translates UI settings to URL state
    function getState() {

        Ox.Log('URL', 'getState:, UI', pandora.user.ui)

        var state = {};

        if (pandora.user.ui.page) {

            state.page = pandora.user.ui.page;
            if (Ox.contains(Object.keys(pandora.site.user.ui.part), state.page)) {
                state.part = pandora.user.ui.part[state.page];
            }

        } else {

            state.type = pandora.user.ui.section == 'items'
                ? pandora.site.itemsSection : pandora.user.ui.section;
            state.item = pandora.user.ui[pandora.user.ui.section.slice(0, -1)];

            if (pandora.user.ui.section == 'items') {
                if (!pandora.user.ui.item) {
                    state.view = pandora.user.ui.listView;
                    state.sort = pandora.user.ui.listSort;
                    state.find = pandora.user.ui.find;
                } else {
                    state.view = pandora.user.ui.itemView;
                    state.sort = pandora.user.ui.itemSort;
                }
                if (state.view == 'map') {
                    state.span = pandora.user.ui.mapFind
                        ? '@' + pandora.user.ui.mapFind
                        : pandora.user.ui.mapSelection
                        ? '@' + pandora.user.ui.mapSelection
                        : '';
                } else if (state.view == 'calendar') {
                    // ...
                } else if (['timeline', 'player', 'editor'].indexOf(state.view) > -1) {
                    var videoPoints = pandora.user.ui.videoPoints[state.item] || {};
                    state.span = videoPoints.annotation || [].concat(
                        videoPoints.position
                            ? videoPoints.position
                            : [],
                        videoPoints['in'] || videoPoints.out
                            ? [videoPoints['in'], videoPoints.out]
                            : []
                    );
                }
            } else if (pandora.user.ui.section == 'edits') {
                var editPoints = pandora.user.ui.editPoints[state.item] || {};
                state.span = editPoints.clip || [].concat(
                    editPoints.position
                        ? editPoints.position
                        : [],
                    editPoints['in'] || editPoints.out
                        ? [editPoints['in'], editPoints.out]
                        : []
                );
            } else if (pandora.user.ui.section == 'texts') {
                var position = pandora.user.ui.textPositions[pandora.user.ui.text];
                if (position) {
                    state.span = position;
                }
            }
            
        }

        if (
            pandora.user.ui._hash && (
                pandora.user.ui._hash.anchor
                || !Ox.isEmpty(pandora.user.ui._hash.query)
            )
        ) {
            state.hash = {};
            if (pandora.user.ui._hash.anchor) {
                state.hash.anchor = pandora.user.ui._hash.anchor;
            }
            if (!Ox.isEmpty(pandora.user.ui._hash.query)) {
                state.hash.query = pandora.user.ui._hash.query;
            }
        }

        Ox.Log('URL', 'GOT STATE ...', state)

        return state;

    }

    // translates URL state to UI settings
    function setState(state, callback) {

        var set = {};

        Ox.Log('URL', 'setState:', state);

        pandora.user.ui._list = pandora.getListState(pandora.user.ui.find);
        pandora.user.ui._filterState = pandora.getFilterState(pandora.user.ui.find);
        pandora.user.ui._findState = pandora.getFindState(pandora.user.ui.find);

        if (Ox.isEmpty(state)) {

            callback && callback();

        } else {

            pandora.user.ui._hash = state.hash;
            if (
                state.hash
                && !Ox.contains(['embed', 'print'], state.hash.anchor)
                && state.hash.query
            ) {
                state.hash.query.forEach(function(kv) {
                    set[kv.key] = kv.value;
                });
            }

            if (state.page) {

                set.page = state.page;
                if (Ox.contains(Object.keys(pandora.site.user.ui.part), state.page) && state.part) {
                    set['part.' + state.page] = state.part;
                }
                pandora.UI.set(set);
                callback && callback();

            } else {

                set.page = '';

                if (state.type) {
                    set.section = state.type == pandora.site.itemsSection ? 'items' : state.type
                    set[set.section.slice(0, -1)] = state.item;
                }

                if (set.section == 'items') {

                    if (state.view) {
                        set[!state.item ? 'listView' : 'itemView'] = state.view;
                    }

                    if (state.span) {
                        if (['timeline', 'player', 'editor'].indexOf(state.view) > -1) {
                            if (Ox.isArray(state.span)) {
                                set['videoPoints.' + state.item] = {
                                    annotation: '',
                                    'in': state.span[state.span.length - 2] || 0,
                                    out: state.span.length == 1 ? 0 : Math.max(
                                        state.span[state.span.length - 2],
                                        state.span[state.span.length - 1]
                                    ),
                                    position: state.span[0]
                                };                       
                            } else {
                                set['videoPoints.' + state.item + '.annotation'] = state.span;
                            }
                        } else if (state.view == 'map') {
                            // fixme: this doesn't handle map coordinates
                            if (state.span[0] != '@') {
                                set.mapSelection = state.span;
                                set.mapFind = '';
                            } else {
                                set.mapFind = state.span.slice(1);
                                set.mapSelection = '';
                            }
                        } else if (state.view == 'calendar') {
                            // fixme: this is still very much unclear
                            if (state.span.length == 1 && /^\d/.test(state.span)) {
                                set.calendarFind = state.span[0];
                            } else if (state.span.length == 2) {
                                set.calendarFind = state.span[0];
                            }
                        }
                    }

                    if (state.sort) {
                        set[!state.item ? 'listSort' : 'itemSort'] = state.sort;
                    }

                    if (!state.item) {
                        if (state.find) {
                            set.find = state.find;
                        } else if (!pandora.$ui.appPanel) {
                            // when loading results without find, clear find, so that
                            // removing a query and reloading works as expected
                            set.find = pandora.site.user.ui.find;
                        }
                    }

                } else if (state.type == 'edits') {

                    if (state.span) {
                        if (Ox.isArray(state.span)) {
                            set['editPoints.' + state.item.replace(/\./g, '\\.')] = {
                                clip: '',
                                'in': state.span[state.span.length - 2] || 0,
                                out: state.span.length == 1 ? 0 : Math.max(
                                    state.span[state.span.length - 2],
                                    state.span[state.span.length - 1]
                                ),
                                position: state.span[0]
                            }
                        } else {
                            set['editPoints.' + state.item.replace(/\./g, '\\.') + '.clip'] = state.span;
                        }
                    }

                } else if (state.type == 'texts') {

                    if (state.span) {
                        set['textPositions.' + state.item] = state.span;
                    }

                }

                Ox.Request.cancel();
                $('video').each(function() {
                    $(this).trigger('stop');
                });

                Ox.Log('URL', 'UI.set', set)
                if (!pandora.$ui.appPanel && state.item && pandora.user.ui.find) {
                    // on page load, if item is set and there was a query,
                    // we have to check if the item actually matches the query,
                    // and otherwise reset find
                    pandora.api.find({
                        query: pandora.user.ui.find,
                        positions: [state.item],
                        sort: [{key: 'id', operator: ''}]
                    }, function(result) {
                        if (Ox.isUndefined(result.data.positions[state.item])) {
                            set.find = pandora.site.user.ui.find
                        }
                        pandora.UI.set(set);
                        callback && callback();
                    });
                } else {
                    pandora.UI.set(set);
                    callback && callback();
                }

            }

        }

    }

    that.init = function() {

        var itemsSection = pandora.site.itemsSection,
            findKeys, sortKeys = {}, spanType = {}, views = {};

        views[itemsSection] = {
            // listView is the default view
            list: [pandora.user.ui.listView].concat(
                pandora.site.listViews.filter(function(view) {
                    return view.id != pandora.user.ui.listView
                }).map(function(view) {
                    return view.id;
                })
            ),
            // itemView is the default view,
            // videoView is the default view if there is a duration
            item: [pandora.user.ui.itemView, pandora.user.ui.videoView].concat(
                pandora.site.itemViews.filter(function(view) {
                    return [
                        pandora.user.ui.itemView, pandora.user.ui.videoView
                    ].indexOf(view.id) == -1;
                }).map(function(view) {
                     return view.id;
                })
            )
        };

        sortKeys[itemsSection] = {list: {}, item: {}};
        views[itemsSection].list.forEach(function(view) {
            sortKeys[itemsSection].list[view] = [].concat(
                // listSort[0].key is the default sort key
                Ox.getObjectById(pandora.site.sortKeys, pandora.user.ui.listSort[0].key)
                    || pandora.isClipView(view)
                        && Ox.getObjectById(pandora.site.clipKeys, pandora.user.ui.listSort[0].key)
                    || [],
                pandora.isClipView(view) ? pandora.site.clipKeys.filter(function(key) {
                    return key.id != pandora.user.ui.listSort[0].key;
                }) : [],
                pandora.site.sortKeys.filter(function(key) {
                    return key.id != pandora.user.ui.listSort[0].key;
                })
            );
        });
        views[itemsSection].item.forEach(function(view) {
            if (pandora.isClipView(view, true)) {
                // itemSort[0].key is the default sort key
                sortKeys[itemsSection].item[view] = [
                    Ox.getObjectById(
                        pandora.site.clipKeys,
                        pandora.user.ui.itemSort[0].key
                    )
                ].concat(
                    pandora.site.clipKeys.filter(function(key) {
                        return key.id != pandora.user.ui.itemSort[0].key;
                    })
                );
            }
        });

        spanType[itemsSection] = {
            list: {
                map: 'location',
                calendar: 'date'
            },
            item: {
                timeline: 'duration',
                player: 'duration',
                editor: 'duration',
                map: 'location',
                calendar: 'date'
            }
        };

        // Edits
        views['edits'] = {
            list: [],
            item: ['edit']
        };
        spanType['edits'] = {
            list: [],
            item: {edit: 'duration'}
        };
        sortKeys['edits'] = {
            list: {},
            item: {}
        };

        // Texts
        views['texts'] = {
            list: [],
            item: ['text']
        };
        spanType['texts'] = {
            list: [],
            item: {text: 'number'}
        };
        sortKeys['texts'] = {
            list: {},
            item: {}
        };

        findKeys = [{id: 'list', type: 'string'}].concat(pandora.site.itemKeys);

        self.URL = Ox.URL({
            findKeys: findKeys,
            getHash: pandora.getHash,
            getItem: pandora.getItem,
            getPart: pandora.getPart,
            getSpan: pandora.getSpan,
            pages: [].concat(
                ['home', 'software', 'api', 'help', 'tv'],
                pandora.site.sitePages.map(function(page) {
                    return page.id;
                }),
                ['preferences', 'signup', 'signin', 'signout']
            ),
            sortKeys: sortKeys,
            spanType: spanType,
            types: [pandora.site.itemName.plural.toLowerCase(), 'edits', 'texts'],
            views: views
        });

        window.addEventListener('hashchange', function() {
            Ox.Request.cancel();
            that.parse();
        });

        window.addEventListener('popstate', function(e) {
            Ox.Request.cancel();
            self.isPopState = true;
            $('.OxDialog:visible').each(function() {
                Ox.UI.elements[$(this).data('oxid')].close();
            });
            if (pandora.$ui.home) {
                pandora.UI.set({page: ''});
                pandora.$ui.home.fadeOutScreen();
            } else if (pandora.$ui.tv) {
                pandora.UI.set({page: ''});
                pandora.$ui.tv.fadeOutScreen();
            }
            if (
                pandora.user.ui.item
                && pandora.user.ui.itemView == 'video'
                && pandora.$ui.player
                && pandora.$ui.player.options('fullscreen')
            ) {
                pandora.$ui.player.remove();
            }
            if (e.state && !Ox.isEmpty(e.state)) {
                Ox.Log('URL', 'E.STATE', e.state)
                document.title = Ox.decodeHTMLEntities(e.state.title);
                setState(e.state);
            } else if (window.location.pathname == '/') {
                pandora.$ui.home = pandora.ui.home().fadeInScreen();
            } else {
                that.parse();
            }
        });

        return that;

    };

    // on page load, this sets the state from the URL
    // can also be used to parse a URL
    that.parse = function(url, callback) {
        if (arguments.length == 2) {
            self.URL.parse(url, callback);
        } else {
            callback = arguments[0];
            url = null;
            if (document.location.pathname.slice(0, 4) == 'url=') {
                document.location.href = decodeURI(document.location.pathname.slice(4));
            } else {
                self.URL.parse(function(state) {
                    // setState -> UI.set -> URL.update
                    setState(state, callback);
                });
            }
        }
        return that;
    };

    // sets the URL to the previous URL
    that.pop = function() {
        self.URL.pop() || that.update();
    };

    // pushes a new URL (as string or from state)
    that.push = function(stateOrURL, expandURL) {
        var state,
            title = pandora.getPageTitle(stateOrURL)
                || pandora.getDocumentTitle(),
            url;
        pandora.expandURL = expandURL;
        if (Ox.isObject(stateOrURL)) {
            state = stateOrURL;
        } else {
            url = stateOrURL;
        }
        self.URL.push(state, title, url, setState);
        return that;
    };

    // replaces the current URL (as string or from state)
    that.replace = function(stateOrURL, title) {
        var state,
            title = pandora.getPageTitle(stateOrURL)
                || pandora.getDocumentTitle(),
            url;
        if (Ox.isObject(stateOrURL)) {
            state = stateOrURL;
        } else {
            url = stateOrURL;
        }
        self.URL.replace(state, title, url, setState);
        return that;
    };

    that.update = function(keys) {
        Ox.Log('URL', 'update.........', keys)
        // this gets called from pandora.UI
        var action, state;
        if (!keys) {
            // may get called from home screen too
            keys = !pandora.user.ui.item
                ? ['listView', 'listSort', 'find']
                : ['item', 'itemView', 'itemSort'];
        }
        if (self.isPopState) {
            self.isPopState = false;
        } else {
            if (
                !pandora.$ui.appPanel
                || pandora.expandURL
                || keys.every(function(key) {
                    return [
                            'listColumnWidth', 'listColumns', 'listSelection',
                            'mapFind', 'mapSelection'
                        ].indexOf(key) > -1
                        || /^videoPoints/.test(key)
                        || /^textPositions/.test(key);
                })
            ) {
                action = 'replace';
            } else {
                action = 'push';
            }
            state = getState();
            self.URL[action](
                state,
                pandora.getPageTitle(state) || pandora.getDocumentTitle()
            );
            pandora.expandURL = false;
        }
    };

    return that;

}());
