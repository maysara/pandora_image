// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.errorDialog = function(data) {

    var that, error, showLogsButton;

    //dont open dialog on unload or if antoher error is open
    //fixme: error dialog should updated instead
    if ($('.OxErrorDialog').length || pandora.isUnloading) {
        return;
    }

    if (data.status.code == 401 || data.status.code == 403) {
        that = pandora.ui.iconDialog({
            buttons: [
                Ox.Button({
                    id: 'close',
                    title: Ox._('Close')
                })
                .bindEvent({
                    click: function() {
                        that.close();
                    }
                })
            ],
            keys: {enter: 'close', escape: 'close'},
            text: Ox._('Sorry, you have made an unauthorized request.'),
            title: Ox.toTitleCase(data.status.text)
        })
        .addClass('OxErrorDialog')
        .open();
    } else {
        // 0 (timeout) or 500 (error)
        error = data.status.code == 0 ? 'timeout' : 'error';
        // on window unload, pending request will time out, so
        // in order to keep the dialog from appearing, delay it
        setTimeout(function() {
            if ($('.OxErrorDialog').length == 0 && !pandora.isUnloading) {
                showLogsButton = error == 'error'
                    && pandora.site.capabilities.canSeeDebugMenu[pandora.user.level]
                that = pandora.ui.iconDialog({
                    buttons: (showLogsButton ? [
                        Ox.Button({
                                title: Ox._('View Error Logs...')
                            })
                            .bindEvent({
                                click: function() {
                                    that.close();
                                    pandora.$ui.logsDialog = pandora.ui.logsDialog().open();
                                }
                            }),
                        {}
                    ] : []).concat([
                        Ox.Button({
                                id: 'close',
                                title: Ox._('Close')
                            })
                            .bindEvent({
                                click: function() {
                                    that.close();
                                }
                            })
                    ]),
                    keys: {enter: 'close', escape: 'close'},
                    text: Ox._('Sorry, a server {0}'
                        + ' occured while handling your request.'
                        + ' To help us find out what went wrong,'
                        + ' you may want to report this error to an administrator.'
                        + ' Otherwise, please try again later.', [error]),
                    title: Ox._('Server {0}', [Ox.toTitleCase(error)])
                })
                .addClass('OxErrorDialog')
                .open();
            }
        }, 250);
    }

};
