// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.mainMenu = function() {
    var isGuest = pandora.user.level == 'guest',
        ui = pandora.user.ui,
        findState = pandora.getFindState(ui.find),
        fromMenu = false,
        fullscreenState = Ox.Fullscreen.getState(),
        that = Ox.MainMenu({
            extras: [
                pandora.$ui.loadingIcon = pandora.ui.loadingIcon()
            ],
            id: 'mainMenu',
            menus: [].concat(
                [
                    { id: pandora.site.site.id + 'Menu', title: pandora.site.site.name, items: [].concat(
                        [
                            { id: 'home', title: Ox._('Home') },
                            {}
                        ],
                        Ox.clone(pandora.site.sitePages, true).map(function(page) {
                            page.title = Ox._(page.title);
                            return page;
                        }),
                        [
                            {},
                            { id: 'software', title: Ox._('Software') }
                        ]
                    ) },
                    { id: 'userMenu', title: Ox._('User'), items: [
                        { id: 'username', title: Ox._('User: {0}', [isGuest ? 'not signed in' : Ox.encodeHTMLEntities(pandora.user.username)]), disabled: true },
                        {},
                        { id: 'preferences', title: Ox._('Preferences...'), disabled: isGuest, keyboard: 'control ,' },
                        { id: 'archives', title: Ox._('Archives...'), disabled: /*isGuest*/ true },
                        {},
                        { id: 'signup', title: Ox._('Sign Up...'), disabled: !isGuest },
                        isGuest ? { id: 'signin', title: Ox._('Sign In...')}
                            : { id: 'signout', title: Ox._('Sign Out...')}
                    ] },
                    getListMenu(),
                    getItemMenu(),
                    { id: 'viewMenu', title: Ox._('View'), items: [
                        { id: 'items', title: Ox._('View {0}', [Ox._(pandora.site.itemName.plural)]), items: [
                            { group: 'listview', min: 1, max: 1, items: pandora.site.listViews.map(function(view) {
                                return Ox.extend({
                                    checked: ui.listView == view.id
                                }, view, {
                                    title: Ox._(view.title)
                                });
                            }) },
                        ]},
                        { id: 'icons', title: Ox._('Icons'), items: [].concat([
                                { group: 'viewicons', min: 1, max: 1, items: ['posters', 'frames'].map(function(icons) {
                                    return {id: icons, title: Ox._(Ox.toTitleCase(icons)), checked: ui.icons == icons};
                                }) },
                                {},
                            ], pandora.site.media.importPosters ? [
                                { id: 'showsiteposters', title: Ox._('Always Show {0} Poster', [pandora.site.site.name]), checked: ui.showSitePosters },
                                {}
                            ] : [], [
                                { id: 'showreflections', title: Ox._('Show Reflections'), checked: true, disabled: true }
                            ]
                        ) },
                        { id: 'timelines', title: Ox._('Timelines'), items: [
                            { group: 'viewtimelines', min: 1, max: 1, items: pandora.site.timelines.map(function(mode) {
                                return {id: mode.id, title: Ox._(mode.title), checked: ui.videoTimeline == mode.id};
                            }) }
                        ]},
                        { id: 'columns', title: Ox._('Columns'), items: [
                            { id: 'loadcolumns', title: Ox._('Load Layout...'), disabled: true },
                            { id: 'savecolumns', title: Ox._('Save Layout...'), disabled: true },
                            {},
                            { id: 'resetcolumns', title: Ox._('Reset Layout'), disabled: true }
                        ] },
                        {},
                        { id: 'item', title: [
                                Ox._('Open {0}', [Ox._(pandora.site.itemName.singular)]),
                                Ox._('Open {0}', [Ox._(pandora.site.itemName.plural)])
                            ], items: [
                            { group: 'itemview', min: 1, max: 1, items: pandora.site.itemViews.map(function(view) {
                                return Ox.extend({
                                    checked: ui.itemView == view.id
                                }, view);
                            }) },
                        ] },
                        { id: 'clips', title: Ox._('Open Clips'), items: [
                            { group: 'videoview', min: 1, max: 1, items: ['player', 'editor', 'timeline'].map(function(view) {
                                return {id: view, title: Ox._(Ox.toTitleCase(view)), checked: ui.videoView == view};
                            }) }
                        ] },
                        {},
                        { id: 'filters', title: Ox._('Filters'), items: [
                            { group: 'filters', min: 5, max: 5, items: pandora.site.filters.map(function(filter) {
                                return Ox.extend({
                                    checked: Ox.getIndexById(ui.filters, filter.id) > -1
                                }, filter, {
                                    title: Ox._(filter.title)
                                });
                            }) },
                            {},
                            { id: 'resetfilters', title: Ox._('Reset Filters') }
                        ] },
                        {},
                        { 
                            id: 'showsidebar',
                            title: Ox._((ui.showSidebar ? 'Hide' : 'Show') + ' Sidebar'),
                            keyboard: 'shift s'
                        },
                        { 
                            id: 'showinfo',
                            title: Ox._((ui.showInfo ? 'Hide' : 'Show') + ' Info'),
                            disabled: !ui.showSidebar, keyboard: 'shift i'
                        },
                        { 
                            id: 'showfilters',
                            title: Ox._((ui.showFilters ? 'Hide' : 'Show') + ' Filters'),
                            disabled: !!ui.item, keyboard: 'shift f'
                        },
                        { 
                            id: 'showbrowser',
                            title: Ox._((ui.showBrowser ? 'Hide': 'Show') + ' {0} Browser', [Ox._(pandora.site.itemName.singular)]),
                            disabled: !ui.item, keyboard: 'shift b'
                        },
                        {
                            id: 'showtimeline',
                            title: Ox._((ui.showTimeline ? 'Hide' : 'Show') + ' Timeline'),
                            disabled: !hasTimeline(), keyboard: 'shift t'
                        },
                        { 
                            id: 'showannotations',
                            title: Ox._((ui.showAnnotations ? 'Hide' : 'Show') + ' Annotations'),
                            disabled: !hasAnnotations(), keyboard: 'shift a'
                        },
                        { 
                            id: 'showclips',
                            title: Ox._((ui.showClips ? 'Hide' : 'Show') + ' Clips'),
                            disabled: !hasClips(), keyboard: 'shift c'
                        },
                        {},
                        { 
                            id: 'togglefullscreen',
                            title: Ox._((fullscreenState ? 'Exit' : 'Enter') + ' Fullscreen'),
                            disabled: fullscreenState === void 0, keyboard: 'shift alt control f'
                        },
                        { 
                            id: 'entervideofullscreen',
                            title: Ox._('Enter Video Fullscreen'),
                            disabled: !ui.item || ui.itemView != 'player'
                        },
                        {},
                        { id: 'theme', title: Ox._('Theme'), items: [
                            { group: 'settheme', min: 1, max: 1, items: pandora.site.themes.map(function(theme) {
                                return {id: theme, title: Ox.Theme.getThemeData(theme).themeName, checked: ui.theme == theme}
                            }) }
                        ] },
                        { id: 'locale', disabled: pandora.user.level != 'admin',
                          title: Ox._('Language'), items: [
                            { group: 'setlocale', min: 1, max: 1, items: Object.keys(Ox.LOCALE_NAMES).map(function(locale) {
                                return {id: locale, title: Ox.LOCALE_NAMES[locale], checked: ui.locale == locale}
                            }) }
                        ] }
                    ]},
                    getSortMenu(),
                    { id: 'findMenu', title: Ox._('Find'), items: [
                        { id: 'find', title: Ox._('Find'), items: [
                            { group: 'find', min: 0, max: 1, items: pandora.site.findKeys.map(function(key, i) {
                                return Ox.extend({
                                    checked: key.id == findState.key
                                }, key);
                            }) }
                        ] },
                        { id: 'advancedfind', title: Ox._('Advanced Find...'), keyboard: 'shift control f' },
                        {},
                        { id: 'findsimilar', title: Ox._('Find Similar Clips...'), keyboard: 'alt control f', disabled: !pandora.getItemIdAndPosition() }
                    ] },
                    { id: 'dataMenu', title: Ox._('Data'), items: [
                        { id: 'documents', title: Ox._('Manage Documents...'), disabled: !pandora.site.capabilities.canManageDocuments[pandora.user.level] },
                        {},
                        { id: 'titles', title: Ox._('Manage Titles...'), disabled: !pandora.site.capabilities.canManageTitlesAndNames[pandora.user.level] },
                        { id: 'names', title: Ox._('Manage Names...'), disabled: !pandora.site.capabilities.canManageTitlesAndNames[pandora.user.level] },
                        {},
                        { id: 'places', title: Ox._('Manage Places...'), disabled: !pandora.site.capabilities.canManagePlacesAndEvents[pandora.user.level] },
                        { id: 'events', title: Ox._('Manage Events...'), disabled: !pandora.site.capabilities.canManagePlacesAndEvents[pandora.user.level] },
                        {},
                        { id: 'users', title: Ox._('Manage Users...'), disabled: !pandora.site.capabilities.canManageUsers[pandora.user.level] },
                        { id: 'statistics', title: Ox._('Statistics...'), disabled: !pandora.site.capabilities.canManageUsers[pandora.user.level] }
                    ] },
                    { id: 'helpMenu', title: Ox._('Help'), items: [
                        { id: 'help', title: Ox._('Help...'), keyboard: 'control ?' },
                        { id: 'api', title: Ox._('API Documentation...'), keyboard: 'shift control ?' }
                    ] }
                ],
                pandora.site.capabilities.canSeeDebugMenu[pandora.user.level]
                    ? [
                        { id: 'debugMenu', title: Ox._('Debug'), items: [
                            { id: 'cache', title: Ox._('Disable Cache'), disabled: true},
                            { id: 'clearcache', title: Ox._('Clear Cache')},
                            {},
                            { id: 'debugmode', title: Ox._((pandora.localStorage('enableDebugMode') ? 'Disable' : 'Enable') + ' Debug Mode') },
                            { id: 'eventlogging', title: Ox._((pandora.localStorage('enableEventLogging') ? 'Disable' : 'Enable') + ' Event Logging')},
                            {},
                            { id: 'errorlogs', title: Ox._('View Error Logs...')},
                            { id: 'tests', title: Ox._('Run Tests')}
                        ] }
                    ]
                    : []
            )
        })
        .bindKeyboard()
        .bindEvent({
            change: function(data) {
                var value = data.checked[0] ? data.checked[0].id : null;
                if (data.id == 'allitems') {
                    if (data.checked) {
                        pandora.UI.set({find: {conditions: [], operator: '&'}});
                    } else {
                        that.checkItem('allitems');
                    }
                } else if (data.id == 'cliporder') {
                    if (!ui.item) {
                        pandora.UI.set({listSort: [{key: ui.listSort[0].key, operator: value == 'ascending' ? '+' : '-'}]});
                    } else {
                        pandora.UI.set({itemSort: [{key: ui.itemSort[0].key, operator: value == 'ascending' ? '+' : '-'}]});
                    }
                } else if (data.id == 'clipsort') {
                    if (!ui.item) {
                        pandora.UI.set({listSort: [{key: value, operator: pandora.getSortOperator(value)}]});
                    } else {
                        pandora.UI.set({itemSort: [{key: value, operator: pandora.getSortOperator(value)}]});
                    }
                } else if (data.id == 'find') {
                    if (value) {
                        pandora.$ui.findSelect.value(value);
                        if (ui._findState.key == 'advanced') {
                            // fixme: autocomplete function doesn't get updated
                            pandora.$ui.findInput.options({placeholder: ''});
                        }
                    } else {
                        that.checkItem('findMenu_find_' + pandora.$ui.findSelect.value());
                    }
                    pandora.$ui.findInput.focusInput(true);
                } else if (data.id == 'itemorder') {
                    pandora.UI.set({listSort: [{key: ui.listSort[0].key, operator: value == 'ascending' ? '+' : '-'}]});
                } else if (data.id == 'itemsort') {
                    pandora.UI.set({listSort: [{key: value, operator: pandora.getSortOperator(value)}]});
                } else if (data.id == 'itemview') {
                    pandora.UI.set({itemView: value});
                } else if (data.id == 'listview') {
                    var set = {listView: value};
                    if (
                        !pandora.isClipView(key, ui.item)
                        && ['title', 'position'].indexOf(ui.listSort[0].key) > -1
                    ) {
                        set.listSort = pandora.site.user.ui.listSort;
                    }
                    pandora.UI.set(set);
                } else if (Ox.startsWith(data.id, 'orderfilter')) {
                    var filters = Ox.clone(ui.filters),
                        id = data.id.replace('orderfilter', ''),
                        index = Ox.getIndexById(filters, id),
                        key = filters[index].sort[0].key,
                        operator = value == 'ascending' ? '+' : '-';
                    pandora.$ui.filters[index].options({
                        sort: [{key: key, operator: operator}]
                    });
                    filters[index].sort[0].operator = operator;
                    pandora.UI.set({filters: filters});
                } else if (data.id == 'setlocale') {
                    pandora.UI.set({locale: value});
                    pandora.setLocale(value, function() {
                        pandora.$ui.appPanel.reload();
                    });
                } else if (data.id == 'settheme') {
                    var iframe, src;
                    Ox.Theme(value);
                    pandora.UI.set({theme: value});
                    iframe = Ox.UI.elements[$('#embed').data('oxid')];
                    if (iframe) {
                        src = iframe.attr('src');
                        if (src && Ox.parseURL(src).hostname == document.location.hostname) {
                            iframe.postMessage('settheme', {theme: value});
                        }
                    }
                } else if (data.id == 'showsiteposters') {
                    pandora.UI.set({showSitePosters: data.checked});
                } else if (Ox.startsWith(data.id, 'sortfilter')) {
                    var filters = Ox.clone(ui.filters),
                        id = data.id.replace('sortfilter', ''),
                        index = Ox.getIndexById(filters, id),
                        type = Ox.getObjectById(pandora.site.filters, id).type,
                        key = value,
                        operator = key == 'name' && type == 'string' ? '+' : '-';
                    pandora.$ui.mainMenu.checkItem(
                        'sortMenu_orderfilters_orderfilter' + id + '_'
                        + (operator == '+' ? 'ascending' : 'descending')
                    );
                    pandora.$ui.filters[index].options({
                        sort: [{key: key, operator: operator}]
                    });
                    filters[index].sort[0].key = key;
                    pandora.UI.set({filters: filters});
                } else if (data.id == 'videoview') {
                    var set = {videoView: value};
                    if (
                        (value == 'timeline' && ['player', 'editor'].indexOf(ui.itemView) > -1)
                        || (value == 'player' && ['timeline', 'editor'].indexOf(ui.itemView) > -1)
                        || (value == 'editor' && ['timeline', 'player'].indexOf(ui.itemView) > -1)
                    ) {
                        set.itemView = value;
                    }
                    pandora.UI.set(set);
                } else if (data.id == 'viewicons') {
                    pandora.UI.set({icons: value});
                } else if (data.id.slice(0, 8) == 'viewlist') {
                    pandora.UI.set({
                        find: {
                            conditions: data.checked ? [
                                {key: 'list', value: data.id.slice(8), operator: '=='}
                            ] : [],
                            operator: '&'
                        }
                    });
                } else if (data.id == 'viewtimelines') {
                    pandora.UI.set({videoTimeline: value});
                }
            },
            click: function(data) {
                if ([
                    'home', 'software', 'signup', 'signin', 'signout',
                    'preferences', 'help', 'api'
                ].concat(
                    pandora.site.sitePages.map(function(page) {
                        return page.id;
                    })
                ).indexOf(data.id) > -1) {
                    pandora.UI.set({page: data.id});
                } else if ([
                    'newlist', 'newlistfromselection', 'newsmartlist', 'newsmartlistfromresults'
                ].indexOf(data.id) > -1) {
                    pandora.addList(data.id.indexOf('smart') > -1, data.id.indexOf('from') > -1);
                } else if (data.id == 'duplicatelist') {
                    pandora.addList(ui._list);
                } else if (data.id == 'editlist') {
                    pandora.ui.listDialog().open();
                } else if (data.id == 'add') {
                    pandora.addItem();
                } else if (data.id == 'upload') {
                    pandora.$ui.uploadDialog = pandora.ui.uploadDialog().open();
                } else if (data.id == 'deletelist') {
                    pandora.ui.deleteListDialog().open();
                } else if (data.id == 'print') {
                    window.open(document.location.href + '#print', '_blank');
                } else if (data.id == 'tv') {
                    pandora.UI.set({'part.tv': ui._list});
                    pandora.UI.set({page: 'tv'});
                } else if (data.id == 'selectall') {
                    pandora.$ui[!ui.item ? 'list' : 'clipList'].selectAll();
                } else if (data.id == 'selectnone') {
                    !ui.item
                        ? pandora.UI.set({listSelection: []})
                        : pandora.$ui.clipList.options({selected: []});
                } else if (data.id == 'invertselection') {
                    pandora.$ui[!ui.item ? 'list' : 'clipList'].invertSelection();
                } else if (data.id == 'cut' || data.id == 'cutadd') {
                    var action = data.id == 'cut' ? 'copy' : 'add';
                    fromMenu = true;
                    Ox.Clipboard[action](ui.listSelection, 'item');
                    pandora.api.removeListItems({
                        list: ui._list,
                        items: ui.listSelection
                    }, function() {
                        pandora.UI.set({listSelection: []});
                        pandora.reloadList();
                    });
                } else if (data.id == 'copy' || data.id == 'copyadd') {
                    var action = data.id == 'copy' ? 'copy' : 'add';
                    fromMenu = true;
                    pandora.isVideoView() && !pandora.$ui.browser.hasFocus() ? Ox.Clipboard[action]([{
                            annotation: ui.videoPoints[ui.item].annotation,
                            'in': pandora.user.ui.videoPoints[ui.item]['in'],
                            item: ui.item,
                            out: ui.videoPoints[ui.item].out
                        }], 'clip')
                        : pandora.isClipView() && !pandora.$ui.browser.hasFocus() ? Ox.Clipboard[action](
                            pandora.$ui.clipList.options('selected'), 'clip'
                        )
                        : Ox.Clipboard[action](ui.listSelection, 'item');
                } else if (data.id == 'paste') {
                    fromMenu = true;
                    var items = Ox.Clipboard.paste();
                    pandora.api.addListItems({
                        list: ui._list,
                        items: items
                    }, function() {
                        pandora.UI.set({listSelection: items});
                        pandora.reloadList();
                    });
                } else if (data.id == 'clearclipboard') {
                    Ox.Clipboard.clear();
                } else if (data.id == 'delete') {
                    pandora.api.removeListItems({
                        list: ui._list,
                        items: ui.listSelection
                    }, function() {
                        pandora.UI.set({listSelection: []});
                        pandora.reloadList();
                    });
                } else if (data.id == 'showsidebar') {
                    pandora.UI.set({showSidebar: !ui.showSidebar});
                } else if (data.id == 'showinfo') {
                    pandora.UI.set({showInfo: !ui.showInfo});
                } else if (data.id == 'showfilters') {
                    pandora.UI.set({showFilters: !ui.showFilters});
                } else if (data.id == 'showbrowser') {
                    pandora.UI.set({showBrowser: !ui.showBrowser});
                } else if (data.id == 'showtimeline') {
                    pandora.UI.set({showTimeline: !ui.showTimeline});
                } else if (data.id == 'showannotations') {
                    pandora.UI.set({showAnnotations: !ui.showAnnotations});
                } else if (data.id == 'showclips') {
                    pandora.UI.set({showClips: !ui.showClips});
                } else if (data.id == 'togglefullscreen') {
                    Ox.Fullscreen.toggle();
                } else if (data.id == 'entervideofullscreen') {
                    pandora.$ui.player.options({fullscreen: true});
                } else if (data.id == 'advancedfind') {
                    pandora.$ui.filterDialog = pandora.ui.filterDialog().open();
                } else if (data.id == 'findsimilar') {
                    pandora.$ui.similarClipsDialog = pandora.ui.similarClipsDialog().open();
                } else if (data.id == 'documents') {
                    pandora.$ui.documentsDialog = pandora.ui.documentsDialog().open();
                } else if (data.id == 'titles') {
                    (pandora.$ui.titlesDialog || (
                        pandora.$ui.titlesDialog = pandora.ui.titlesDialog()
                    )).open();
                } else if (data.id == 'names') {
                    (pandora.$ui.namesDialog || (
                        pandora.$ui.namesDialog = pandora.ui.namesDialog()
                    )).open();
                } else if (data.id == 'places') {
                    (pandora.$ui.placesDialog || (
                        pandora.$ui.placesDialog = pandora.ui.placesDialog()
                    )).open();
                } else if (data.id == 'events') {
                    (pandora.$ui.eventsDialog || (
                        pandora.$ui.eventsDialog = pandora.ui.eventsDialog()
                    )).open();
                } else if (data.id == 'users') {
                    pandora.$ui.usersDialog = pandora.ui.usersDialog().open();
                } else if (data.id == 'statistics') {
                    pandora.$ui.statisticsDialog = pandora.ui.statisticsDialog().open();
                } else if (data.id == 'resetfilters') {
                    pandora.UI.set({
                        filters: pandora.site.user.ui.filters
                    });
                    pandora.$ui.contentPanel.replaceElement(0, pandora.$ui.browser = pandora.ui.browser());
                } else if (data.id == 'clearcache') {
                    Ox.Request.clearCache();
                } else if (data.id == 'debugmode') {
                    if (pandora.localStorage('enableDebugMode')) {
                        pandora.localStorage['delete']('enableDebugMode');
                    } else {
                        pandora.localStorage('enableDebugMode', true);
                    }
                    window.location.reload();
                } else if (data.id == 'eventlogging') {
                    if (pandora.localStorage('enableEventLogging')) {
                        pandora.localStorage['delete']('enableEventLogging');
                    } else {
                        pandora.localStorage('enableEventLogging', true);
                    }
                    Ox.Event[pandora.localStorage('enableEventLogging') ? 'bind' : 'unbind'](pandora.logEvent);
                    that.setItemTitle('eventlogging', Ox._((pandora.localStorage('enableEventLogging') ? 'Disable' : 'Enable') + ' Event Logging'));
                } else if (data.id == 'errorlogs') {
                    pandora.$ui.logsDialog = pandora.ui.logsDialog().open();
                } else if (data.id == 'tests') {
                    pandora.tests();
                }
            },
            key_alt_control_f: function() {
                if (!pandora.hasDialogOrScreen() && pandora.getItemIdAndPosition()) {
                    pandora.$ui.similarClipsDialog = pandora.ui.similarClipsDialog().open();
                }
            },
            key_alt_control_shift_a: function() {
                if (!pandora.hasDialogOrScreen() && !ui.item) {
                    pandora.$ui.filters.clearFilters();
                }
            },
            key_alt_control_shift_f: function() {
                Ox.Fullscreen.toggle();
            },
            key_backtick: function() {
                changeFocus(1);
            },
            key_control_comma: function() {
                if (!pandora.hasDialogOrScreen()) {
                    pandora.UI.set({page: 'preferences'});
                }
            },
            key_control_f: function() {
                if (!pandora.hasDialogOrScreen()) {
                    if (ui._findState.key != 'advanced') {
                        setTimeout(function() {
                            pandora.$ui.findInput.focusInput(true);
                        }, 25);
                    } else {
                        pandora.$ui.filterDialog = pandora.ui.filterDialog().open();
                    }
                }
            },
            key_control_m: function() {
                if (!pandora.hasDialogOrScreen() && !that.isSelected()) {
                    that.options('menus')[0].element.trigger('click');
                }
            },
            key_control_p: function() {
                window.open(document.location.href + '#?print=true', '_blank');
            },
            key_control_shift_f: function() {
                if (!pandora.hasDialogOrScreen()) {
                    pandora.$ui.filterDialog = pandora.ui.filterDialog().open();
                }
            },
            key_control_shift_slash: function() {
                if (!pandora.hasDialogOrScreen()) {
                    pandora.UI.set({page: 'api'});
                }
            },
            key_control_shift_w: function() {
                if (!pandora.hasDialogOrScreen() || (ui.item || ui._list)) {
                    pandora.UI.set({find: {conditions: [], operator: '&'}});
                }
            },
            key_control_slash: function() {
                if (!pandora.hasDialogOrScreen()) {
                    pandora.UI.set({page: 'help'});
                }
            },
            key_control_space: function() {
                if (!pandora.hasDialogOrScreen()) {
                    pandora.UI.set({'part.tv': ui._list});
                    pandora.UI.set({page: 'tv'});
                }
            },
            key_control_w: function() {
                if (!pandora.hasDialogOrScreen()) {
                    if (ui.section == 'items') {
                        if (ui.item) {
                            pandora.UI.set({item: ''});
                        } else if (ui._list) {
                            pandora.UI.set({find: {conditions: [], operator: '&'}});
                        }
                    } else if (ui.section == 'edits') {
                        pandora.UI.set({edit: ''});
                    } else if (ui.section == 'texts') {
                        pandora.UI.set({text: ''});
                    }
                }
            },
            key_shift_a: function() {
                hasAnnotations() && pandora.UI.set({showAnnotations: !ui.showAnnotations});
            },
            key_shift_b: function() {
                ui.item && pandora.UI.set({showBrowser: !ui.showBrowser});
            },
            key_shift_c: function() {
                hasClips && pandora.UI.set({showClips: !ui.showClips});
            },
            key_shift_backtick: function() {
                changeFocus(-1);
            },
            key_shift_f: function() {
                !ui.item && pandora.UI.set({showFilters: !ui.showFilters});
            },
            key_shift_i: function() {
                ui.showSidebar && pandora.UI.set({showInfo: !ui.showInfo});
            },
            key_shift_s: function() {
                pandora.UI.set({showSidebar: !ui.showSidebar});
            },
            key_shift_t: function() {
                hasTimeline() && pandora.UI.set({showTimeline: !ui.showTimeline});
            },
            pandora_edit: function() {
                // ...
            },
            pandora_find: function() {
                var action = pandora.getListData().editable ? 'enableItem' : 'disableItem',
                    list = ui._list,
                    previousList = pandora.UI.getPrevious()._list;
                if (list != previousList) {
                    that.uncheckItem(previousList == '' ? 'allitems' : 'viewlist' + previousList);
                    that.checkItem(list == '' ? 'allitems' : 'viewlist' + list);
                }
                that[action]('editlist');
                that[action]('duplicatelist');
                that[action]('deletelist');
                that[ui.listSelection.length ? 'enableItem' : 'disableItem']('newlistfromselection');
                that.replaceMenu('itemMenu', getItemMenu());
            },
            pandora_filters: function(data) {
                that.replaceMenu('sortMenu', getSortMenu());
            },
            pandora_item: function(data) {
                if (!!data.value != !!data.previousValue) {
                    that.replaceMenu('itemMenu', getItemMenu());
                    that[data.value ? 'disableItem' : 'enableItem']('showfilters');
                    that[data.value ? 'enableItem' : 'disableItem']('showbrowser');
                    that.replaceMenu('sortMenu', getSortMenu());
                }
                if (!data.value) {
                    that.disableItem('showannotations');
                    that.disableItem('showtimeline');
                    that.disableItem('entervideofullscreen');
                } else {
                    if (['timeline', 'player', 'editor'].indexOf(ui.itemView) > -1) {
                        that.enableItem('showannotations');
                    }
                    if (ui.itemView == 'player') {
                        that.enableItem('showtimeline');
                        that.enableItem('entervideofullscreen');
                    }
                }
            },
            pandora_itemsort: function(data) {
                that.checkItem('sortMenu_sortclips_' + data.value[0].key);
                that.checkItem('sortMenu_orderclips_' + (
                    data.value[0].operator == '+' ? 'ascending' : 'descending')
                );
            },
            pandora_itemview: function(data) {
                var action,
                    isClipView = pandora.isClipView(),
                    isVideoView = pandora.isVideoView(),
                    wasClipView = pandora.isClipView(data.previousValue),
                    wasVideoView = pandora.isVideoView(data.previousValue);
                if (isClipView != wasClipView || isVideoView != wasVideoView) {
                    that.replaceMenu('itemMenu', getItemMenu());
                }
                that.checkItem('viewMenu_item_' + data.value);
                if (isVideoView) {
                    that.checkItem('viewMenu_clips_' + data.value);
                }
                if (isVideoView != wasVideoView) {
                    that[isVideoView ? 'enableItem' : 'disableItem']('showannotations');
                }
                if ((data.value == 'player') != (data.previousValue == 'player')) {
                    action = data.value == 'player' ? 'enableItem' : 'disableItem';
                    that[action]('showtimeline');
                    that[action]('entervideofullscreen');
                }
                if (isClipView != wasClipView) {
                    that.replaceMenu('sortMenu', getSortMenu());
                }
                that[
                    pandora.getItemIdAndPosition() ? 'enableItem' : 'disableItem'
                ]('findsimilar');
            },
            pandora_listselection: function(data) {
                var action = data.value.length ? 'enableItem' : 'disableItem';
                that[action]('newlistfromselection');
                that.replaceMenu('itemMenu', getItemMenu());
                that[
                    pandora.getItemIdAndPosition() ? 'enableItem' : 'disableItem'
                ]('findsimilar');
            },
            pandora_listsort: function(data) {
                if (pandora.isClipView(ui.listView, false)) {
                    that.checkItem('sortMenu_sortclips_' + data.value[0].key);
                    that.checkItem('sortMenu_orderclips_' + (
                        data.value[0].operator == '+' ? 'ascending' : 'descending')
                    );
                } else {
                    that.checkItem('sortMenu_sortitems_' + data.value[0].key);
                    that.checkItem('sortMenu_orderitems_' + (
                        data.value[0].operator == '+' ? 'ascending' : 'descending')
                    );
                }
            },
            pandora_listview: function(data) {
                that.checkItem('viewMenu_items_' + data.value);
                if (
                    pandora.isClipView() != pandora.isClipView(data.previousValue)
                    || pandora.isVideoView() != pandora.isVideoView(data.previousValue)
                ) {
                    that.replaceMenu('itemMenu', getItemMenu());
                }
                if (pandora.isClipView() != pandora.isClipView(data.previousValue)) {
                    that.replaceMenu('sortMenu', getSortMenu());
                }
                that[
                    pandora.getItemIdAndPosition() ? 'enableItem' : 'disableItem'
                ]('findsimilar');
            },
            pandora_section: function() {
                that.replaceMenu('listMenu', getListMenu());
                that.replaceMenu('sortMenu', getSortMenu());
            },
            pandora_showannotations: function(data) {
                that.setItemTitle('showannotations', Ox._((data.value ? 'Hide' : 'Show') + ' Annotations'));
            },
            pandora_showbrowser: function(data) {
                that.setItemTitle('showbrowser', Ox._((data.value ? 'Hide' : 'Show') + ' {0} Browser', [Ox._(pandora.site.itemName.singular)]));
            },
            pandora_showclips: function(data) {
                that.setItemTitle('showclips', Ox._((data.value ? 'Hide' : 'Show') + ' Clips'));
            },
            pandora_showfilters: function(data) {
                that.setItemTitle('showfilters', Ox._((data.value ? 'Hide' : 'Show') + ' Filters'));
            },
            pandora_showinfo: function(data) {
                that.setItemTitle('showinfo', Ox._((data.value ? 'Hide' : 'Show') + ' Info'));
            },
            pandora_showsidebar: function(data) {
                that.setItemTitle('showsidebar', Ox._((data.value ? 'Hide' : 'Show') + ' Sidebar'));
                that[data.value ? 'enableItem' : 'disableItem']('showinfo');
            },
            pandora_showtimeline: function(data) {
                that.setItemTitle('showtimeline', Ox._((data.value ? 'Hide' : 'Show') + ' Timeline'));
            },
            pandora_videopoints: function(data) {
                var action = data.value['in'] != data.value.out ? 'enableItem' : 'disableItem';
                that[action]('copy');
                that[action]('copyadd');
            },
            pandora_videotimeline: function(data) {
                that.checkItem('viewMenu_timelines_' + data.value);
            }
        });

    Ox.Clipboard.bindEvent(function(data, event) {
        if (Ox.contains(['add', 'copy', 'paste'], event) && !fromMenu) {
            that.highlightMenu('itemMenu');
        }
        if (Ox.contains(['add', 'copy', 'clear'], event)) {
            that.replaceMenu('itemMenu', getItemMenu());
        }
        fromMenu = false;
    });

    Ox.Fullscreen.bind('change', function(state) {
        that.setItemTitle('togglefullscreen', Ox._((state ? 'Exit' : 'Enter') + ' Fullscreen'));
    });

    function changeFocus(direction) {
        var elements = [],
            index,
            listData = pandora.getListData();
        elements[0] = !listData.folder ? pandora.$ui.allItems
            : pandora.$ui.folderList[listData.folder];
        if (!ui.item && ui.showFilters) {
            pandora.$ui.filters.forEach(function($filter) {
                if ($filter.options('selected').length) {
                    elements.push($filter);
                }
            });
        } else if (ui.item && ui.showBrowser) {
            elements.push(pandora.$ui.browser);
        }
        if (!ui.item) {
            if (['map', 'calendar'].indexOf(ui.listView) > -1) {
                elements.push(pandora.$ui[ui.listView]);
                if (pandora.$ui.clipList.options('selected').length) {
                    elements.push(pandora.$ui.clipList);
                }
            } else if (pandora.$ui.list.options('selected').length) {
                elements.push(pandora.$ui.list);
            }
        } else {
            if (['player', 'editor', 'timeline', 'map', 'calendar'].indexOf(ui.itemView) > -1) {
                elements.push(pandora.$ui[ui.itemView]);
            }
            if (
                ['clips', 'map', 'calendar'].indexOf(ui.itemView) > -1
                && pandora.$ui.clipList.options('selected').length
            ) {
                elements.push(pandora.$ui.clipList);
            }
            if (
                ui.itemView == 'data'
                && pandora.$ui.item.options('selected').length
            ) {
                elements.push(pandora.$ui.item);
            }
        }
        index = direction == 1 ? -1 : elements.length;
        Ox.forEach(elements, function(element, i) {
            if (element.hasFocus()) {
                index = i;
                return false;
            }
        });
        elements[Ox.mod((index + direction), elements.length)].gainFocus();
    }

    function getItemMenu() {
        var listData = pandora.getListData(),
            isClipView = pandora.isClipView()
                && pandora.$ui.clipList
                && pandora.$ui.clipList.hasFocus(),
            isVideoView = pandora.isVideoView()
                && pandora.$ui[ui.itemView]
                && pandora.$ui[ui.itemView].hasFocus(),
            listItemsName = Ox._(
                isVideoView || isClipView ? 'Clips' : pandora.site.itemName.plural
            ),
            selectionItems = isVideoView ? 1
                : isClipView ? pandora.$ui.clipList.options('selected').length
                : ui.listSelection.length,
            selectionItemName = (selectionItems > 1 ? Ox.formatNumber(selectionItems) + ' ' : '') + Ox._(
                isVideoView ? 'Clip'
                : isClipView ? (selectionItems == 1 ? 'Clip' : 'Clips')
                : pandora.site.itemName[selectionItems == 1 ? 'singular' : 'plural']
            ),
            clipboardItems = Ox.Clipboard.items(),
            clipboardType = Ox.Clipboard.type(),
            clipboardItemName = clipboardItems == 0 ? ''
                : (clipboardItems > 1 ? Ox.formatNumber(clipboardItems) + ' ' : '') + Ox._(
                    clipboardType == 'item' ? pandora.site.itemName[clipboardItems == 1 ? 'singular' : 'plural']
                    : clipboardType == 'clip' ? (clipboardItems == 1 ? 'Clip' : 'Clips')
                    : ''
                ),
            canSelect = !ui.item || isClipView,
            canCopy = isVideoView ? ui.videoPoints[ui.item]['in'] != ui.videoPoints[ui.item].out
                : isClipView ? pandora.$ui.clipList.options('selected').length
                : !!ui.listSelection.length,
            canAdd = canCopy && clipboardItems > 0 && ((clipboardType == 'item') == (!isVideoView && !isClipView)),
            canPaste = !ui.item && !isClipView && !isVideoView
                && listData.editable && listData.type == 'static' && Ox.Clipboard.type() == 'item',
            canCut = canCopy && !ui.item && !isClipView && !isVideoView
                && listData.editable && listData.type == 'static';
        return { id: 'itemMenu', title: Ox._('Item'), items: [
            { id: 'add', title: Ox._('Add {0}', [Ox._(pandora.site.itemName.singular)]), disabled: pandora.site.itemRequiresVideo || !pandora.site.capabilities.canAddItems[pandora.user.level] },
            { id: 'upload', title: Ox._('Upload Video...'), disabled: !pandora.site.capabilities.canAddItems[pandora.user.level] },
            {},
            { id: 'selectall', title: Ox._('Select All {0}', [listItemsName]), disabled: !canSelect, keyboard: 'control a' },
            { id: 'selectnone', title: Ox._('Select None'), disabled: !canSelect, keyboard: 'shift control a' },
            { id: 'invertselection', title: Ox._('Invert Selection'), disabled: !canSelect, keyboard: 'alt control a' },
            {},
            { id: 'cut', title: Ox._('Cut {0}', [selectionItemName]), disabled: !canCut, keyboard: 'control x' },
            { id: 'cutadd', title: Ox._('Cut and Add to Clipboard'), disabled: !canCut || !canAdd, keyboard: 'shift control x' },
            { id: 'copy', title: Ox._('Copy {0}', [selectionItemName]), disabled: !canCopy, keyboard: 'control c' },
            { id: 'copyadd', title: Ox._('Copy and Add to Clipboard'), disabled: !canCopy || !canAdd, keyboard: 'shift control c' },
            { id: 'paste', title: clipboardItems == 0 ? Ox._('Paste') : Ox._('Paste {0}', [clipboardItemName]), disabled: !canPaste, keyboard: 'control v' },
            { id: 'clearclipboard', title: Ox._('Clear Clipboard'), disabled: !clipboardItems},
            {},
            { id: 'delete', title: Ox._('Delete {0}' + (!isVideoView && !isClipView ? ' from List' : ''), [selectionItemName]), disabled: !canCut, keyboard: 'delete' },
            {},
            { id: 'undo', title: Ox._('Undo'), disabled: true, keyboard: 'control z' },
            { id: 'redo', title: Ox._('Redo'), disabled: true, keyboard: 'shift control z' }
        ] };
    }

    function getListMenu(lists) {
        var itemNameSingular = ui.section == 'items' ? 'List' : ui.section == 'edits' ? 'Edit' : 'Text',
            itemNamePlural = ui.section == 'items' ? 'Lists' : ui.section == 'edits' ? 'Edits' : 'Texts';
        return { id: 'listMenu', title: Ox._(itemNameSingular), items: [].concat(
            {
                id: 'allitems',
                title: pandora.getAllItemsTitle(),
                checked: ui.section == 'items' ? !ui.item && !ui._list
                    : ui.section == 'edits' ? !ui.edit
                    : !ui.text,
                keyboard: 'shift control w'
            },
            ['personal', 'favorite', 'featured'].map(function(folder) {
                return {
                    id: folder + 'lists',
                    title: Ox._(Ox.toTitleCase(folder) + ' ' + itemNamePlural),
                    items: Ox.isUndefined(lists)
                        ? [{id: 'loading', title: Ox._('Loading...'), disabled: true}]
                        : lists[folder].length == 0
                        ? [{id: 'nolists', title: Ox._('No ' + Ox.toTitleCase(folder) + ' ' + itemNamePlural), disabled: true}]
                        : lists[folder].map(function(list) {
                            return {
                                id: 'viewlist' + list.id,
                                title: Ox.encodeHTMLEntities((
                                    folder == 'favorite' ? list.user + ': ' : ''
                                ) + list.name),
                                checked: ui.section == 'items' ? list.id == ui._list
                                    : ui.section == 'edits' ? list.id == ui.edit
                                    : list.id == ui.text
                            };
                        })
                };
            }),
            [
                {},
                { id: 'newlist', title: Ox._('New ' + itemNameSingular), disabled: isGuest, keyboard: 'control n' },
            ],
            ui.section != 'texts' ? [
                { id: 'newlistfromselection', title: Ox._('New ' + itemNameSingular + ' from Selection'), disabled: isGuest || ui.listSelection.length == 0, keyboard: 'shift control n' },
                { id: 'newsmartlist', title: Ox._('New Smart ' + itemNameSingular), disabled: isGuest, keyboard: 'alt control n' },
                { id: 'newsmartlistfromresults', title: Ox._('New Smart ' + itemNameSingular + ' from Results'), disabled: isGuest, keyboard: 'shift alt control n' },
            ] : [],
            [
                {},
                { id: 'duplicatelist', title: Ox._('Duplicate Selected ' + itemNameSingular), disabled: isGuest || !ui._list, keyboard: 'control d' },
                { id: 'editlist', title: Ox._('Edit Selected ' + itemNameSingular + '...'), disabled: isGuest || !ui._list, keyboard: 'control e' },
                { id: 'deletelist', title: Ox._('Delete Selected ' + itemNameSingular + '...'), disabled: isGuest || !ui._list, keyboard: 'delete' }
            ],
            ui.section == 'items' ? [
                {},
                { id: 'print', title: Ox._('Print'), keyboard: 'control p' },
                { id: 'tv', title: Ox._('TV'), keyboard: 'control space' }
            ] : []
        )};
    };

    function getSortMenu() {
        var isClipView = pandora.isClipView(),
            clipItems = (isClipView ? pandora.site.clipKeys.map(function(key) {
                return Ox.extend(Ox.clone(key), {
                    checked: ui.listSort[0].key == key.id,
                    title: (!ui.item ? Ox._('Clip') + ' ' : '') + Ox._(key.title)
                });
            }) : []).concat(!ui.item ? pandora.site.sortKeys.map(function(key) {
                return Ox.extend({
                    checked: ui.listSort[0].key == key.id
                }, key);
            }) : []);
        return { id: 'sortMenu', title: Ox._('Sort'), items: [
            { id: 'sortitems', title: Ox._('Sort {0} by', [Ox._(pandora.site.itemName.plural)]), disabled: ui.section != 'items' || (!ui.item && isClipView), items: [
                { group: 'itemsort', min: 1, max: 1, items: pandora.site.sortKeys.map(function(key) {
                    return Ox.extend({
                        checked: ui.listSort[0].key == key.id
                    }, key, {
                        title: Ox._(key.title)
                    });
                }) }
            ] },
            { id: 'orderitems', title: Ox._('Order {0}', [Ox._(pandora.site.itemName.plural)]), disabled: ui.section != 'items' || (!ui.item && isClipView), items: [
                { group: 'itemorder', min: 1, max: 1, items: [
                    { id: 'ascending', title: Ox._('Ascending'), checked: (ui.listSort[0].operator || pandora.getSortOperator(ui.listSort[0].key)) == '+' },
                    { id: 'descending', title: Ox._('Descending'), checked: (ui.listSort[0].operator || pandora.getSortOperator(ui.listSort[0].key)) == '-' }
                ]}
            ] },
            { id: 'sortclips', title: Ox._('Sort Clips by'), disabled: !isClipView, items: [
                { group: 'clipsort', min: 1, max: 1, items: clipItems }
            ] },
            { id: 'orderclips', title: Ox._('Order Clips'), disabled: !isClipView, items: [
                { group: 'cliporder', min: 1, max: 1, items: [
                    {
                        id: 'ascending',
                        title: Ox._('Ascending'),
                        checked: (ui.listSort[0].operator || pandora.getSortOperator(ui.listSort[0].key)) == '+'
                    },
                    { 
                        id: 'descending',
                        title: Ox._('Descending'),
                        checked: (ui.listSort[0].operator || pandora.getSortOperator(ui.listSort[0].key)) == '-' 
                    }
                ]}
            ] },
            { id: 'advancedsort', title: Ox._('Advanced Sort...'), keyboard: 'shift control s', disabled: true },
            {},
            { id: 'sortfilters', title: Ox._('Sort Filters'), disabled: ui.section != 'items', items: ui.filters.map(function(filter) {
                return {
                    id: 'sortfilter' + filter.id,
                    title: Ox._('Sort {0} Filter by', [Ox._(Ox.getObjectById(pandora.site.filters, filter.id).title)]),
                    items: [
                        { group: 'sortfilter' + filter.id, min: 1, max: 1, items: [
                            { id: 'name', title: Ox._('Name'), checked: filter.sort[0].key == 'name' },
                            { id: 'items', title: Ox._('Items'), checked: filter.sort[0].key == 'items' }
                        ] }
                    ]
                }
            }) },
            { id: 'orderfilters', title: Ox._('Order Filters'), disabled: ui.section != 'items', items: ui.filters.map(function(filter) {
                return {
                    id: 'orderfilter' + filter.id,
                    title: Ox._('Order {0} Filter', [Ox._(Ox.getObjectById(pandora.site.filters, filter.id).title)]),
                    items: [
                        { group: 'orderfilter' + filter.id, min: 1, max: 1, items: [
                            { id: 'ascending', title: Ox._('Ascending'), checked: filter.sort[0].operator == '+' },
                            { id: 'descending', title: Ox._('Descending'), checked: filter.sort[0].operator == '-' }
                        ] }
                    ]
                }
            }) }
        ] };
    }

    function hasAnnotations() {
        return ui.section == 'items' && ui.item && pandora.isVideoView();
    }

    function hasClips() {
        return ui.section == 'edits' && ui.edit;
    }

    function hasTimeline() {
        return (
            ui.section == 'items' && ui.item && ui.itemView == 'player'
        ) || (
            ui.section == 'edits' && ui.edit
        );
    }

    that.replaceItemMenu = function() {
        that.replaceMenu('itemMenu', getItemMenu());
        return that;
    };

    // fixme: the sidebar makes (almost) the same requests.
    // is it ok to make them twice, or should the sidebar trigger the menu replace?

    var counter = 0,
        lists = {},
        queries = {
            // fixme: duplicated
            personal: {conditions: [
                {key: 'user', value: pandora.user.username, operator: '=='},
                {key: 'status', value: 'featured', operator: '!='}
            ], operator: '&'},
            favorite: {conditions: [
                {key: 'subscribed', value: true, operator: '='},
                {key: 'status', value: 'featured', operator: '!='},
            ], operator: '&'},
            featured: {conditions: [
                {key: 'status', value: 'featured', operator: '='}
            ], operator: '&'}
        };

    Ox.forEach(queries, function(query, folder) {
        pandora.api[
            ui.section == 'items' ? 'findLists'
            : ui.section == 'edits' ? 'findEdits'
            : 'findTexts'
        ]({
            query: query,
            keys: ['id', 'name', 'user'],
            sort: [{key: 'position', operator: '+'}]
        }, function(result) {
            lists[folder] = result.data.items;
            if (++counter == 3) {
                pandora.$ui.mainMenu.replaceMenu('listMenu', getListMenu(lists));
            }
        });
    });

    return that;

};
