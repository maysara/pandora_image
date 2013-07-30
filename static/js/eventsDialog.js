// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.eventsDialog = function(options) {
    // options can be {id: '...'} or {name: '...'}
    var height = Math.round((window.innerHeight - 48) * 0.9),
        width = Math.round(window.innerWidth * 0.9),
        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'managePlaces',
                    title: Ox._('Manage Places...')
                }).bindEvent({
                    click: function() {
                        that.close();
                        (pandora.$ui.placesDialog || (
                            pandora.$ui.placesDialog = pandora.ui.placesDialog()
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
            content: Ox.LoadingScreen(),
            height: height,
            maximizeButton: true,
            minHeight: 256,
            minWidth: 512,
            padding: 0,
            title: Ox._('Manage Events'),
            width: width
        })
        .bindEvent({
            resize: function(data) {
                // setting width would cause an expensive calendar redraw
                $content && $content.options({
                    height: data.height
                });
            },
            resizeend: function(data) {
                $content && $content.options({
                    height: data.height, width: data.width
                });
            }
        }),
        $content;

    pandora.api.findEvents({
        query: {conditions: [], operator: '&'}
    }, function(result) {
        pandora.api.findEvents({
            query: {conditions: [], operator: '&'},
            keys: [],
            range: [0, result.data.items],
            sort: [{key: 'name', operator: '+'}]
        }, function(result) {
            that.options({
                content: $content = Ox.CalendarEditor({
                    addEvent: function(event, callback) {
                        pandora.api.addEvent(event, function(result) {
                            Ox.Request.clearCache(); // fixme: remove
                            callback(result);
                        });
                    },
                    editEvent: function(event, callback) {
                        pandora.api.editEvent(event, function(result) {
                            Ox.Request.clearCache(); // fixme: remove
                            callback(result);
                        });
                    },
                    events: result.data.items,
                    hasMatches: true,
                    height: height,
                    mode: pandora.site.calendar == 'auto' ? 'add' : 'define',
                    removeEvent: function(event, callback) {
                        pandora.api.removeEvent(event, function(result) {
                            Ox.Request.clearCache(); // fixme: remove
                            callback(result);
                        });
                    },
                    selected: options ? options.id : '',
                    showControls: pandora.user.ui.showCalendarControls,
                    width: width
                })
            });
        })
    })

    return that;
};

