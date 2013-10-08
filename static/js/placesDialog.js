// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.placesDialog = function(options) {
    // options can be {id: '...'} or {name: '...'}
    var height = Math.round((window.innerHeight - 48) * 0.9),
        width = Math.round(window.innerWidth * 0.9),
        $content = Ox.MapEditor({
            addPlace: function(place, callback) {
                pandora.api.addPlace(place, function(result) {
                    Ox.Request.clearCache(); // fixme: remove
                    callback(result);
                });
            },
            editPlace: function(place, callback) {
                pandora.api.editPlace(place, function(result) {
                    Ox.Request.clearCache(); // fixme: remove
                    callback(result);
                });
            },
            getMatches: function(names, callback) {
                // fixme: the results of this are of course
                // not identical to actual place matches
                var conditions = [], keys, operator;
                if (names.length == 0) {
                    callback(0);
                } else {
                    keys = pandora.site.layers.filter(function(layer) {
                        return layer.type == 'place' || layer.hasPlaces;
                    }).map(function(layer) {
                        return layer.id;
                    });
                    keys.forEach(function(key) {
                        operator = Ox.getObjectById(
                            pandora.site.layers, key
                        ).type == 'place' ? '==' : '=';
                        names.forEach(function(name) {
                            conditions.push({key: key, value: name, operator: operator});
                        });
                    });
                    pandora.api.findClips({
                        query: {
                            conditions: conditions,
                            operator: conditions.length == 1 ? '&' : '|'
                        }
                    }, function(result) {
                        callback(result.data.items);
                    });
                }
            },
            hasMatches: true, // FIXME: getMatches is enough
            height: height - 48,
            mode: pandora.site.map == 'auto' ? 'add' : 'define',
            names: pandora.hasPlacesLayer ? function(callback) {
                pandora.api.getPlaceNames(function(result) {
                    callback(result.data.items);
                });
            } : null,
            places: function(data, callback) {
                data.keys && data.keys.push('matches');
                return pandora.api.findPlaces(Ox.extend({
                    query: {conditions: [], operator: ''}
                }, data), callback);
            },
            removePlace: function(place, callback) {
                pandora.api.removePlace(place, function(result) {
                    Ox.Request.clearCache(); // fixme: remove
                    callback(result);
                });
            },
            selected: options ? options.id : '',
            showControls: pandora.user.ui.showMapControls,
            showLabels: pandora.user.ui.showMapLabels,
            showTypes: true,
            width: width
        }),
        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'manageEvents',
                    title: Ox._('Manage Events...')
                }).bindEvent({
                    click: function() {
                        that.close();
                        (pandora.$ui.eventsDialog || (
                            pandora.$ui.eventsDialog = pandora.ui.eventsDialog()
                        )).open();
                    }
                }),
                {},
                Ox.Button({
                    id: 'done',
                    title: Ox._('Done'),
                    width: 48
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                })
            ],
            closeButton: true,
            content: $content,
            height: height,
            maximizeButton: true,
            minHeight: 256,
            minWidth: 512,
            //keys: {enter: 'done', escape: 'done'},
            padding: 0,
            title: Ox._('Manage Places'),
            width: width
        })
        .bindEvent({
            resize: function(data) {
                $content.options({width: width, height: height});
            }
        });
    return that;
};

