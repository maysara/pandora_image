// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.uploadPDFDialog = function(options) {

    var cancelled = false,
        file,
        selectFile,
        $cancelButton,
        $closeButton,
        $content = Ox.Element().css({margin: '16px'}),
        $progress,
        $status = $('<div>').css({padding: '4px', paddingTop: '8px'}),
        that = Ox.Dialog({
            buttons: [
                $closeButton = Ox.Button({
                    id: 'close',
                    title: Ox._('Close')
                }).bindEvent({
                    click: function() {
                        that.triggerEvent('close');
                    }
                }),
                $cancelButton = Ox.Button({
                    id: 'cancel',
                    title: Ox._('Cancel'),
                    disabled: true
                }).bindEvent({
                    click: function(data) {
                        cancelled = true;
                        pandora.$ui.upload && pandora.$ui.upload.abort();
                        $fileButton.show();
                        $cancelButton.hide()
                        $closeButton.show();
                    }
                }),
            ],
            content: $content,
            height: 128,
            removeOnClose: true,
            width: 368,
            title: Ox._('Upload PDF'),
        })
        .bindEvent({
            close: function(data) {
                if (pandora.firefogg) {
                    pandora.firefogg.cancel();
                    delete pandora.firefogg;
                }
                that.close();
            }
        });

    $content.append($status);
    upload(options.file);

    function resetProgress() {
        $progress = Ox.Progressbar({
            progress: 0,
            showPercent: true,
            showTime: true,
            width: 304
        });
        $status.html('').append($progress);
    }

    function upload(file) {
        resetProgress();
        pandora.$ui.upload = pandora.chunkupload({
            file: file,
            url: '/api/upload/text/',
            data: {
                name: file.name,
                id: options.id
            },
            progress: function(data) {
                var progress = data.progress || 0;
                $progress.options({progress: progress});
            },
            callback: function(result) {
                if (result.progress == 1) {
                    Ox.Request.clearCache();
                    // fixme reload text view here
                    that.close();
                } else {
                    $content.html("failed: " + result.responseText);
                }
            }
        }).bindEvent({
            progress: function(data) {
                $progress.options({progress: data.progress || 0});
            },
            done: function(data) {
                if (data.progress == 1) {
                    Ox.Request.clearCache();
                    pandora.$ui.mainPanel.replaceElement(1, pandora.$ui.rightPanel = pandora.ui.rightPanel());
                    that.close();
                } else {
                    $content.html("failed: " + data.responseText);
                }
            }
        });
    }

    return that;

};

