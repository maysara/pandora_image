// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.onloadDialog = function() {

    var dialogHeight = Math.round((window.innerHeight - 48) * 0.75),
        dialogWidth = Math.round(window.innerWidth * 0.75),
        $input = Ox.Input({
                height: dialogHeight - 32,
                id: 'onload',
                placeholder: Ox._('/*\nAny JavaScript you paste here will run on load.\n'
                    + 'If you ever need to manually change or remove it, '
                    + 'you can do so by setting localStorage["pandora.onload"] in the console.\n*/'),
                type: 'textarea',
                value: localStorage['pandora.onload'] || '',
                width: dialogWidth - 32
            })
            .css({margin: '16px'}),
        that = Ox.Dialog({
                buttons: [
                    Ox.Button({
                            title: Ox._('Clear')
                        })
                        .css({margin: '4px 4px 4px 0'})
                        .bindEvent({
                            click: function() {
                                clear();
                            }
                        }),
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
                content: $input,
                height: dialogHeight,
                maximizeButton: true,
                minHeight: 256,
                minWidth: 512,
                removeOnClose: true,
                title: Ox._('Run Script on Load'),
                width: dialogWidth
            })
            .bindEvent({
                resize: resize
            });

    function resize(data) {
        dialogHeight = data.height;
        dialogWidth = data.width;
        $input.options({
            height: dialogHeight - 32,
            width: dialogWidth - 32
        });
    }

    function clear() {
        delete localStorage['pandora.onload'];
        $input.options({value: ''});
    }

    that.superClose = that.close;
    that.close = function() {
        var value = $input.value();
        if (value) {
            localStorage['pandora.onload'] = value;
        } else {
            delete localStorage['pandora.onload'];
        }
        that.superClose();
    };

    return that;

};

