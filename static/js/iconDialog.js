'use strict';

pandora.ui.iconDialog = function(options) {

    var options = Ox.extend({
                closeButton: false,
                height: 128,
                keys: null,
                text: '',
                title: '',
                width: 368,
            }, options),

        that = Ox.Dialog({
            buttons: options.buttons,
            closeButton: options.closeButton,
            content: Ox.Element()
                .append(
                    $('<img>')
                        .attr({src: '/static/png/icon.png'})
                        .css({position: 'absolute', left: '16px', top: '16px', width: '64px', height: '64px'})
                )
                .append(
                    $('<div>')
                        .addClass('OxTextPage')
                        .css({position: 'absolute', left: '96px', top: '16px', width: options.width - 112 + 'px'})
                        .html(options.text)
                ),
            fixedSize: true,
            height: options.height,
            keys: options.keys,
            removeOnClose: true,
            title: options.title,
            width: options.width
        });

    return that;

};