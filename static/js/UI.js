// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.UI = (function() {

    var self = {}, that = {};

    self.previousUI = {};

    that.encode = function(val) {
        return val.replace(/\./g, '\\.');
    };

    that.getPrevious = function(key) {
        // fixme: probably unneeded by now
        return !key ? self.previousUI : self.previousUI[key];
    };

    that.reset = function() {
        pandora.api.resetUI({}, function() {
            pandora.user.ui = pandora.site.user.ui;
            pandora.user.ui._list = pandora.getListState(pandora.user.ui.find);
            pandora.user.ui._filterState = pandora.getFilterState(pandora.user.ui.find);
            pandora.user.ui._findState = pandora.getFindState(pandora.user.ui.find);
            Ox.Theme(pandora.user.ui.theme);
            pandora.$ui.appPanel.reload();
        });
    };

    // sets pandora.user.ui.key to val
    // key foo.bar.baz sets pandora.user.ui.foo.bar.baz
    // val null removes a key
    that.set = function(/* {key: val}[, flag] or key, val[, flag] */) {

        var add = {},
            args,
            item,
            list,
            listSettings = pandora.site.listSettings,
            listView,
            set = {},
            trigger = {},
            triggerEvents;

        if (Ox.isObject(arguments[0])) {
            args = arguments[0];
            triggerEvents = Ox.isUndefined(arguments[1]) ? true : arguments[1];
        } else {
            args = Ox.makeObject([arguments[0], arguments[1]]);
            triggerEvents = Ox.isUndefined(arguments[2]) ? true : arguments[1];
        }

        Ox.Log('UI', 'SET', JSON.stringify(args));

        self.previousUI = Ox.clone(pandora.user.ui, true);
        self.previousUI._list = pandora.getListState(self.previousUI.find);

        if (args.section == 'texts') {
            trigger['section'] = args['section'];
            trigger['text'] = args['text'];
        } else if (args.section == 'edits') {
            trigger['section'] = args['section'];
            trigger['edit'] = args['edit'];
        } else {
            if ('find' in args) {
                // the challenge here is that find may change list,
                // and list may then change listSort and listView,
                // which we don't want to trigger, since find triggers
                // (values we put in add will be changed, but won't trigger)
                list = pandora.getListState(args.find);
                pandora.user.ui._list = list;
                pandora.user.ui._filterState = pandora.getFilterState(args.find);
                pandora.user.ui._findState = pandora.getFindState(args.find);
                if (pandora.$ui.appPanel && !pandora.stayInItemView) {
                    // if we're not on page load, and if find isn't a context change
                    // caused by an edit, then switch from item view to list view
                    args['item'] = '';
                }
                if (list != self.previousUI._list) {
                    Ox.Log('UI', 'FIND HAS CHANGED LIST')
                    // if find has changed list
                    Ox.forEach(listSettings, function(listSetting, setting) {
                        // then for each setting that corresponds to a list setting
                        if (!pandora.user.ui.lists[list]) {
                            // either add the default setting
                            add[setting] = pandora.site.user.ui[setting];
                        } else {
                            // or the existing list setting
                            add[setting] = pandora.user.ui.lists[list][listSetting]
                        }
                    });
                }
                add.itemFind = pandora.getItemFind(args.find);
            } else {
                list = self.previousUI._list;
            }
            // it is important to check for find first, so that
            // if find changes list, list is correct here
            item = args.item || pandora.user.ui.item;
            listView = add.listView || args.listView;

            if (listView) {
                if (pandora.isClipView(listView)) {
                    // when switching to a clip view, clear list selection
                    // (but don't trigger an additional event)
                    add.listSelection = [];
                } else if (['text', 'position'].indexOf(pandora.user.ui.listSort[0].key) > -1) {
                    // when switching to a non-clip view, with a sort key
                    // that only exists in clip view, reset sort to default
                    args.listSort = pandora.site.user.ui.listSort;
                }
            }

            if (!pandora.user.ui.lists[list]) {
                add['lists.' + that.encode(list)] = {};
            }
            Ox.forEach(listSettings, function(listSetting, setting) {
                // for each setting that corresponds to a list setting
                // set that list setting to
                var key = 'lists.' + that.encode(list) + '.' + listSetting;
                if (setting in args) {
                    // the setting passed to UI.set
                    add[key] = args[setting];
                } else if (setting in add) {
                    // or the setting changed via find
                    add[key] = add[setting];
                } else if (!pandora.user.ui.lists[list]) {
                    // or the default setting
                    add[key] = pandora.site.user.ui[setting];
                }
            });

            if (args.item) {
                // when switching to an item, update list selection
                add['listSelection'] = [args.item];
                add['lists.' + that.encode(list) + '.selection'] = [args.item];
                if (
                    !args.itemView
                    && ['timeline', 'player', 'editor'].indexOf(pandora.user.ui.itemView) > -1
                    && !pandora.user.ui.videoPoints[item]
                    && !args['videoPoints.' + item]
                ) {
                    // if the item view doesn't change, remains a video view,
                    // video points don't exist yet, and won't be set,
                    // add default video points
                    add['videoPoints.' + item] = {annotation: '', 'in': 0, out: 0, position: 0};
                }
            }

            if (['timeline', 'player', 'editor'].indexOf(args.itemView) > -1) {
                // when switching to a video view, add it as default video view
                args.videoView = args.itemView;
                if (
                    !pandora.user.ui.videoPoints[item]
                    && !args['videoPoints.' + item]
                ) {
                    // if video points don't exist yet, and won't be set,
                    // add default video points
                    add['videoPoints.' + item] = {annotation: '', 'in': 0, out: 0, position: 0};
                }
            }
        }

        if (args.edit) {
            if (
                !pandora.user.ui.editPoints[args.edit]
                && !args['editPoints.' + args.edit]
            ) {
                add['editPoints.' + args.edit] = {clip: '', 'in': 0, out: 0, position: 0};
            }
        }

        // items in args trigger events, items in add do not
        [args, add].forEach(function(obj, isAdd) {
            Ox.forEach(obj, function(val, key) {
                // make sure to not split at escaped dots ('\.')
                var keys = key.replace(/\\\./g, '\n').split('.').map(function(key) {
                        return key.replace(/\n/g, '.')
                    }),
                    ui = pandora.user.ui;
                while (keys.length > 1) {
                    ui = ui[keys.shift()];
                }
                if (!Ox.isEqual(ui[keys[0]], val)) {
                    if (val === null) {
                        delete ui[keys[0]]
                    } else {
                        ui[keys[0]] = val;
                    }
                    set[key] = val;
                    if (!isAdd) {
                        trigger[key] = val;
                    }
                }
            });
        });
        if (Ox.len(set) && !pandora.isEmbedURL() && !pandora.isPrintURL()) {
            pandora.api.setUI(set);
        }
        triggerEvents && Ox.forEach(trigger, function(val, key) {
            Ox.Log('UI', 'TRIGGER ' + key + ' ' + val);
            Ox.forEach(pandora.$ui, function(element) {
                Ox.UI.isElement(element) && element.triggerEvent('pandora_' + key.toLowerCase(), {
                    value: val,
                    previousValue: self.previousUI[key]
                });
            });
        });
        
        pandora.URL.update(Object.keys(
            !pandora.$ui.appPanel ? args : trigger
        ));

    };

    return that;

}());

