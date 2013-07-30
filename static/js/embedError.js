'use strict';

pandora.ui.embedError = function(notImplemented) {

    var that = Ox.Element()
        .addClass('OxScreen')
        .css({
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
        });

    $('<div>')
        .css({
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            width: '96px',
            height: '48px',
            paddingTop: '16px',
            margin: 'auto'
        })
        .append(
            $('<img>')
                .css({width: '96px'})
                .attr({src: '/static/png/logo.png'})
        )
        .append(
            $('<div>')
                .css({marginTop: '4px', fontSize: '9px', textAlign: 'center'})
                .html(
                    notImplemented
                    ? Ox._('This view is not<br>implemented.')
                    : Ox._('This view cannot<br>be embedded.')
                )
        )
        .appendTo(that);

    return that;

};
