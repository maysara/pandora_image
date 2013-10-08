'use strict';

pandora.ui.insertEmbedDialog = function(/*[url, ]callback*/) {

    if (arguments.length == 1) {
        var url, callback = arguments[0];
    } else {
        var url = arguments[0], callback = arguments[1];
    }

    var advanced = pandora.user.ui.showAdvancedEmbedOptions,
        dialogHeight = 344,
        dialogWidth = 416 + Ox.UI.SCROLLBAR_SIZE,
        formWidth = dialogWidth - 32 - Ox.UI.SCROLLBAR_SIZE,

        that = Ox.Dialog({
                buttons: [
                    Ox.Button({
                            id: 'cancel',
                            title: Ox._('Cancel'),
                            width: 64
                        })
                        .bindEvent({
                            click: function() {
                                that.close();
                            }
                        }),
                    Ox.Button({
                            id: 'insert',
                            title: Ox._('Insert'),
                            width: 64
                        })
                        .bindEvent({
                            click: function() {
                                callback($input.url.options('value'));
                                that.close();
                            }
                        })
                ],
                closeButton: true,
                content: Ox.Element(),
                height: dialogHeight,
                keys: {enter: 'insert', escape: 'cancel'},
                removeOnClose: true,
                title: Ox._('Insert Embed'),
                width: dialogWidth
            }),
        $input = {},

        api = pandora.api,
        duration,
        item,
        options = {
            keys: ['id', 'duration'],
            query: {conditions: [], operator: '&'},
            range: [0, 1],
            sort: [{key: 'id', operator: '+'}],
        },
        sites = [pandora.site.site].concat(pandora.site.sites).map(function(site) {
            return {id: site.url, title: site.url, https: site.https};
        });

    api.find(options, function(result) {

        duration = result.data.items[0].duration;
        item = result.data.items[0].id;

        var $panel = Ox.TabPanel({
                content: function(id) {
                    if (id == 'video') {
                        var $content = Ox.TabPanel({
                            content: function(id_) {
                                pandora.UI.set({
                                    showAdvancedEmbedOptions: id_ == 'advanced'
                                });
                                return getForm(id);
                            },
                            tabs: [
                                {id: 'basic', title: Ox._('Basic'), selected: !advanced},
                                {id: 'advanced', title: Ox._('Advanced'), selected: advanced}
                            ]
                        });
                    } else {
                        // ...
                    }
                    return $content;
                },
                tabs: [
                    {id: 'video', title: Ox._('Video'), selected: true},
                    {id: 'map', title: Ox._('Map'), disabled: true},
                    {id: 'calendar', title: Ox._('Calendar'), disabled: true}
                ]
            });

        that.options({content: $panel});

    });

    function getForm(id) {

        var $form;

        if (id == 'video') {

            $form = $('<div>')
                .attr({id: 'form'})
                .css({padding: '16px', overflowY: 'auto'});

            $input.url = Ox.Input({
                    label: Ox._('URL'),
                    labelWidth: 128,
                    width: formWidth,
                    value: url
                })
                .bindEvent({
                    change: function(data) {
                        parseURL(data.value);
                    }
                })
                .css({display: 'inline-block', margin: '4px 0'})
                .appendTo($form);

            space().appendTo($form);

            $input.protocol = Ox.Select({
                    items: [
                        {id: 'http', title: 'http'},
                        {id: 'https', title: 'https', disabled: !pandora.site.site.https}
                    ],
                    label: Ox._('Protocol'),
                    labelWidth: 128,
                    value: pandora.site.site.https ? 'https' : 'http',
                    width: formWidth
                })
                .bindEvent({
                    change: formatURL
                })
                .addClass('advanced')
                .css({display: 'inline-block', margin: '4px 0'})
                .appendTo($form);

            $input.site = Ox.SelectInput({
                    inputWidth: 128,
                    items: sites.concat([{id: 'other', title: Ox._('Other...')}]),
                    label: Ox._('Site'),
                    labelWidth: 128,
                    placeholder: 'example.com',
                    max: 1,
                    min: 1,
                    value: pandora.site.site.url,
                    width: formWidth
                })
                .bindEvent({
                    change: function(data) {
                        if (data.value) {
                            var site = Ox.getObjectById(sites, data.value);
                            $input.protocol[
                                !site || site.https ? 'enableItem' : 'disableItem'
                            ]('https').options({
                                value: !site || !site.https ? 'http' : 'https'
                            });
                            updateAPI(data.value, formatURL);
                        }
                    }
                })
                .addClass('advanced')
                .css({display: 'inline-block', margin: '4px 0'})
                .appendTo($form);

            $input.item = Ox.Input({
                    label: Ox._(pandora.site.itemName.singular),
                    labelWidth: 128,
                    value: item,
                    width: formWidth
                })
                .css({display: 'inline-block', margin: '4px 0'})
                .bindEvent({
                    change: function(data) {
                        api.get({
                            id: data.value,
                            keys: ['duration']
                        }, function(result) {
                            if (result.data) {
                                duration = result.data.duration;
                            } else {
                                $input.item.options({value: item});
                            }
                        });
                        formatURL();
                    }
                })
                .appendTo($form);

            $input.link = Ox.Select({
                    items: [
                        {id: 'default', title: Ox._('Default')},
                        {id: 'player', title: Ox._('Player')},
                        {id: 'editor', title: Ox._('Editor')},
                        {id: 'timeline', title: Ox._('Timeline')}
                    ],
                    label: Ox._('Link'),
                    labelWidth: 128,
                    value: 'default',
                    width: formWidth
                })
                .addClass('advanced')
                .css({display: 'inline-block', margin: '4px 0'})
                .bindEvent({
                    change: formatURL
                })
                .appendTo($form);

            $input.position = Ox.Input({
                    label: Ox._('Position'),
                    labelWidth: 128,
                    placeholder: '00:00:00.000',
                    width: formWidth
                })
                .addClass('advanced')
                .css({display: 'inline-block', margin: '4px 0'})
                .bindEvent({
                    change: function(data) {
                        var hasInAndOut = $input['in'].options('value') !== '';
                        if (data.value) {
                            $input.position.options({
                                value: limitPoint(
                                    data.value,
                                    hasInAndOut ? $input['in'].options('value') : 0,
                                    hasInAndOut ? $input.out.options('value') : duration
                                )
                            });
                        }
                        $input.annotation.options({value: ''});
                        formatURL();
                    }
                })
                .appendTo($form);

            $input['in'] = Ox.Input({
                    label: Ox._('In Point'),
                    labelWidth: 128,
                    placeholder: '00:00:00.000',
                    width: formWidth
                })
                .css({display: 'inline-block', margin: '4px 0'})
                .bindEvent({
                    change: function(data) {
                        if (data.value) {
                            $input['in'].options({
                                value: limitPoint(data.value, 0, duration)
                            });
                            if ($input.out.options('value') === '') {
                                $input.out.options({value: Ox.formatDuration(duration)});
                            } else if (
                                Ox.parseDuration($input.out.options('value'))
                                < Ox.parseDuration(data.value)
                            ) {
                                $input.out.options({value: data.value});
                            }
                            $input.annotation.options({value: ''});
                        }
                        formatURL();
                    }
                })
                .appendTo($form);

            $input.out = Ox.Input({
                    label: Ox._('Out Point'),
                    labelWidth: 128,
                    placeholder: '00:00:00.000',
                    width: formWidth
                })
                .css({display: 'inline-block', margin: '4px 0'})
                .bindEvent({
                    change: function(data) {
                        if (data.value) {
                            $input.out.options({
                                value: limitPoint(data.value, 0, duration)
                            });
                            if ($input['in'].options('value') === '') {
                                $input['in'].options({value: Ox.formatDuration(0)});
                            } else if (
                                Ox.parseDuration($input['in'].options('value'))
                                > Ox.parseDuration(data.value)
                            ) {
                                $input['in'].options({value: data.value});
                            }
                            $input.annotation.options({value: ''});
                        }
                        formatURL();
                    }
                })
                .appendTo($form);

            $input.annotation = Ox.Input({
                    label: Ox._('Annotation'),
                    labelWidth: 128,
                    width: formWidth
                })
                .css({display: 'inline-block', margin: '4px 0'})
                .bindEvent({
                    change: function(data) {
                        ['position', 'in', 'out'].forEach(function(key) {
                            $input[key].options({value: ''});
                        });
                        formatURL();
                    }
                })
                .appendTo($form);

            space().appendTo($form);

            $input.title = Ox.Input({
                    label: Ox._('Title'),
                    labelWidth: 128,
                    width: formWidth
                })
                .addClass('advanced')
                .css({display: 'inline-block', margin: '4px 0'})
                .bindEvent({
                    change: formatURL
                })
                .appendTo($form);

            $input.showTimeline = Ox.Checkbox({
                    label: Ox._('Show Large Timeline'),
                    labelWidth: 128,
                    value: false,
                    width: formWidth
                })
                .addClass('advanced')
                .css({display: 'inline-block', margin: '4px 0'})
                .bindEvent({
                    change: function() {
                        updateForm();
                        formatURL();
                    }
                })
                .appendTo($form);

            $input.timeline = Ox.Select({
                    items: [
                        {id: 'default', title: Ox._('Default')}
                    ].concat(
                        pandora.site.timelines
                    ),
                    label: Ox._('Timeline'),
                    labelWidth: 128,
                    value: 'default',
                    width: formWidth
                })
                .addClass('advanced')
                .css({display: 'inline-block', margin: '4px 0'})
                .bindEvent({
                    change: formatURL
                })
                .appendTo($form);

            $input.showAnnotations = Ox.Checkbox({
                    label: Ox._('Show Annotations'),
                    labelWidth: 128,
                    value: false,
                    width: formWidth
                })
                .addClass('advanced')
                .css({display: 'inline-block', margin: '4px 0'})
                .bindEvent({
                    change: function() {
                        updateForm();
                        formatURL();
                    }
                })
                .appendTo($form);

            var $showLayersLabel = Ox.Label({
                    title: Ox._('Show Layers'),
                    width: formWidth
                })
                .addClass('advanced')
                .css({display: 'inline-block', margin: '4px 0'})
                .bindEvent({
                    change: formatURL
                })
                .appendTo($form);

            $input.showLayers = Ox.CheckboxGroup({
                    checkboxes: pandora.site.layers.map(function(layer) {
                        return {id: layer.id, title: layer.title};
                    }),
                    max: pandora.site.layers.length,
                    min: 0,
                    type: 'list',
                    value: pandora.site.layers.map(function(layer) {
                        return layer.id;
                    }),
                    width: formWidth - 128
                })
                .addClass('advanced')
                .css({display: 'inline-block', margin: '4px 0 4px 128px'})
                .bindEvent({
                    change: formatURL
                })
                .appendTo($form);

            url ? parseURL() : formatURL();
            updateForm();

        } else {

            // ...

        }

        function formatURL() {
            var data = Ox.map($input, function($element) {
                return $element.options('value');
            });
            Ox.print('FU', data.protocol + '://'
            + data.site + '/'
            + data.item + '/'
            + (data.link == 'default' ? '' : data.link + '/')
            + ([data.position] || []).concat(
                data['in'] || data.out
                ? [data['in'], data.out]
                : []
            ).join(','),
            + (data.annotation || '')
            + '#embed?'
            + Ox.serialize({
                title: data.title,
                showTimeline: data.showTimeline || null,
                timeline: data.timeline,
                showAnnotations: data.showAnnotations || null,
                showLayers: data.showAnnotations && data.showLayers ? data.showLayers : null,
                matchRatio: true
            }, true));
            $input.url.options({
                value: data.protocol + '://'
                    + data.site + '/'
                    + data.item + '/'
                    + (data.link == 'default' ? '' : data.link + '/')
                    + ([data.position] || []).concat(
                        data['in'] || data.out
                        ? [data['in'], data.out]
                        : []
                    ).join(',')
                    + (data.annotation || '')
                    + '#embed?'
                    + Ox.serialize({
                        title: data.title,
                        showTimeline: data.showTimeline || null,
                        timeline: data.timeline,
                        showAnnotations: data.showAnnotations || null,
                        showLayers: data.showAnnotations && data.showLayers ? data.showLayers : null,
                        matchRatio: true
                    }, true)
            });
        }

        function limitPoint(value, min, max) {
            return Ox.formatDuration(
                Ox.limit(
                    Ox.parseDuration(value),
                    Ox.parseDuration(min),
                    Ox.parseDuration(max)
                )
            );
        }

        function parseURL(url) {
            var parsed = Ox.parseURL(url),
                protocol = parsed.protocol.replace(/:$/, ''),
                site = parsed.hostname,
                isSameSite = site == $input.site.options('value');
            (isSameSite ? Ox.noop : updateAPI)(site, function() {
                pandora.URL.parse(parsed.pathname + parsed.search + parsed.hash, function(state) {
                    var isSameItem = isSameSite && state.item == item,
                        id = (isSameSite ? state.item : url.split('/')[3]) || item,
                        query = {};
                    if (state.hash) {
                        state.hash.query.forEach(function(condition) {
                            query[condition.key] = condition.value;
                        });
                    }
                    (isSameItem ? Ox.noop : api.get)({id: id, keys: ['duration']}, function(result) {
                        if (result && result.data) {
                            duration = result.data.duration;
                            item = id;
                        }
                        Ox.forEach({
                            protocol: protocol,
                            site: site,
                            item: item,
                            link: state.view || 'default', // FIXME: wrong, user-dependent
                            position: Ox.isArray(state.span)
                                ? Ox.formatDuration(state.span[0]) : '',
                            'in': Ox.isArray(state.span)
                                ? Ox.formatDuration(state.span[state.span.length - 2]) : '',
                            out: Ox.isArray(state.span)
                                ? Ox.formatDuration(state.span[state.span.length - 1]) : '',
                            annotation: Ox.isString(state.span) ? state.span : '',
                            title: query.title || '',
                            showTimeline: query.showTimeline || false,
                            timeline: query.timeline || 'default',
                            showAnnotations: query.showAnnotations || false,
                            showLayers: query.showLayers || pandora.site.layers.map(function(layer) {
                                return layer.id;
                            })
                        }, function(value, key) {
                            Ox.print('????', key, value);
                            $input[key].options({value: value});
                        });
                    });
                });
            });
        }

        function updateAPI(url, callback) {
            api = Ox.API({
                url: $input.protocol.options('value') + '://' + url + '/api/'
            }, function() {
                api.find(options, function(result) {
                    duration = result.data.items[0].duration;
                    item = result.data.items[0].id;
                    $input.item.options({value: item}); // fixme: move out
                    callback();
                });
            });
        }

        function updateForm() {
            $form.find('.advanced')[
                pandora.user.ui.showAdvancedEmbedOptions
                ? 'show' : 'hide'
            ]();
            $input.timeline[
                $input.showTimeline.options('value')
                ? 'show' : 'hide'
            ]();
            $showLayersLabel[
                $input.showAnnotations.options('value')
                ? 'show' : 'hide'
            ]();
            $input.showLayers[
                $input.showAnnotations.options('value')
                ? 'show' : 'hide'
            ]();
        }

        function space() {
            return $('<div>').css({height: '16px', width: formWidth + 'px'});
        }

        return $form;

    }

    return that;

};
