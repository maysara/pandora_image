// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.uploadDocumentDialog = function(file, callback) {

    var extension = file.name.split('.').pop().toLowerCase(),

        extensions = ['gif', 'jpg', 'jpeg', 'pdf', 'png'],

        filename = file.name.split('.').slice(0, -1).join('.') + '.'
            + (extension == 'jpeg' ? 'jpg' : extension),

        id = pandora.user.username + ':' + filename,

        upload,

        $errorDialog,

        $content = Ox.Element().css({margin: '16px'}),

        $text = $('<div>')
            .html(Ox._('Uploading {0}', [file.name]))
            .appendTo($content),

        $progress = Ox.Progressbar({
                width: 256,
                showPercent: true,
                showTime: true
            })
            .css({margin: '16px 0 16px 0'})
            .appendTo($content),

        $message = $('<div>')
            .appendTo($content),

        $uploadDialog = Ox.Dialog({
                buttons: [
                    Ox.Button({
                        id: 'close',
                        title: Ox._('Cancel Upload')
                    }).bindEvent({
                        click: function() {
                            var title = this.options('title');
                            $uploadDialog.close();
                            if (title == Ox._('Cancel Upload')) {
                                upload.abort();
                            } else if (title == Ox._('Done')) {
                                callback({
                                    id: id
                                });
                            }
                        }
                    })
                ],
                content: $content,
                height: 112,
                keys: {escape: 'close'},
                width: 288,
                title: Ox._('Upload File')
            })
            .bindEvent({
                open: function() {
                    upload = pandora.chunkupload({
                            data: {
                                filename: filename
                            },
                            file: file,
                            url: '/api/upload/document/',
                        })
                        .bindEvent({
                            done: function(data) {
                                if (data.progress == 1) {
                                    $uploadDialog.options('buttons')[0].options({title: Ox._('Done')});
                                    Ox.print('SUCCEEDED');
                                } else {
                                    $message.html(Ox._('Upload failed.'))
                                    $uploadDialog.options('buttons')[0].options({title: Ox._('Close')});
                                    Ox.print('FAILED');
                                }
                            },
                            progress: function(data) {
                                $progress.options({progress: data.progress || 0});
                            }
                        });
                }
            });

    if (!Ox.contains(extensions, extension)) {
        return errorDialog(Ox._('Supported file types are GIF, JPG, PNG and PDF.'));
    } else {
        Ox.oshash(file, function(oshash) {
            pandora.api.findDocuments({
                keys: ['id'],
                query: {
                    conditions: [{key: 'oshash', value: oshash, operator: '=='}],
                    operator: '&'
                },
                range: [0, 1],
                sort: [{key: 'name', operator: '+'}]
            }, function(result) {
                if (result.data.items.length) {
                    errorDialog(filename == result.data.items[0].id
                        ? Ox._('The file {0} already exists', [filename])
                        : Ox._('The file {0} already exists as {1}', [filename, result.data.items[0].id])
                    ).open();
                } else {
                    $uploadDialog.open();
                }
            })
        });
        return {open: Ox.noop};
    }

    function errorDialog(text) {
        return $errorDialog = pandora.ui.iconDialog({
            buttons: [
                Ox.Button({
                        id: 'close',
                        title: Ox._('Close')
                    })
                    .bindEvent({
                        click: function() {
                            $errorDialog.close();
                        }
                    })
            ],
            title: Ox._('Upload File'),
            text: text
        });
    }

};

