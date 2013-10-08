// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.embedDocumentDialog = function(id) {

    var isImage = Ox.contains(['jpg', 'png'], selected.split('.').pop()),
        url = 'http' + (pandora.site.site.https ? 's' : '') + '://'
            + pandora.site.site.url + '/documents/' + id,

        $content = Ox.Element()
            .css({margin: '16px'})
            .html(
                Ox._('To embed this file, use the following HTML:<br>')
            ),

        $embed = $('<textarea>')
            .css({
                width: '336px',
                height: '64px',
                marginTop: '8px',
            })
            .val(
                isImage
                ? '<img src="' + url + '">'
                : '<a href="' + url + '"><img src="' + url + '.jpg"></a>'
            )
            .on({
                click: function() {
                    this.focus();
                    this.select();
                }
            })
            .appendTo($content),

        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'close',
                    title: Ox._('Close')
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                })
            ],
            closeButton: true,
            content: $content,
            fixedSize: true,
            height: 128,
            keys: {escape: 'close'},
            removeOnClose: true,
            title: Ox._('Embed File'),
            width: 368 
        });

    return that;

};
