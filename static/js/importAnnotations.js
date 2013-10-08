// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.importAnnotations = function(data) {
    var content = Ox.Element().css({margin: '16px'}),
        file,
        height = 128,
        layers = pandora.site.layers.filter(function(layer) {
            return layer.canAddAnnotations[pandora.user.level];
        }),
        layer,
        srt = [],
        total = 0,
        importButton,
        selectLayer,
        selectFile,
        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'close',
                    title: Ox._('Close')
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                }),
                importButton = Ox.Button({
                    disabled: true,
                    id: 'import',
                    title: Ox._('Import')
                }).bindEvent({
                    click: function() {
                        importButton.hide();
                        addAnnotations();
                    }
                })
            ],
            closeButton: true,
            content: content,
            keys: {
                'escape': 'close'
            },
            height: 128,
            removeOnClose: true,
            width: 368,
            title: Ox._('Import Annotations')
        })
        .bindEvent({
            close: function(data) {
                that.close();
            }
        }),
        $status = $('<div>').css({
            padding: '4px',
            paddingBottom: '8px'
        }).appendTo(content);

    setStatus(Ox._('Please select layer and .srt file'))
    function addAnnotations() {
        var annotations, task;
        if (srt.length > 0) {
            setStatus(Ox._('Loading...'));
            var annotations = srt.filter(function(data) {
                return !Ox.isUndefined(data['in']) && !Ox.isUndefined(data.out) && data.text;
            
            }).map(function(data) {
                return {
                    'in': data['in'],
                    out: data.out,
                    value: Ox.sanitizeHTML(data.text)
                        .replace(/<br[ /]*?>\n/g, '\n')
                        .replace(/\n\n/g, '<br>\n')
                        .replace(/\n/g, '<br>\n')
                };
            });
            pandora.api.addAnnotations({
                annotations: annotations,
                item: pandora.user.ui.item,
                layer: layer
            }, function(result) {
                if (result.data.taskId) {
                    $status.html('').append(Ox.LoadingScreen({
                        text: Ox._('Importing {0} annotations...', [srt.length])
                    }));
                    pandora.wait(result.data.taskId, function(result) {
                        if (result.data.status == 'SUCCESS') {
                            setStatus(Ox._('{0} annotations imported.', [annotations.length]));
                            Ox.Request.clearCache(pandora.user.ui.item);
                            pandora.$ui.contentPanel.replaceElement(
                                1, pandora.$ui.item = pandora.ui.item()
                            );
                        } else {
                            setStatus(Ox._('Importing annotations failed.'));
                        }
                    });
                } else {
                    setStatus(Ox._('Importing annotations failed.'));
                }
            });
        }
    }
    function parseSRT(data) {
        var srt = Ox.parseSRT(data),
            length = srt.length - 1;
        //pandora layers include outpoint,
        //speedtrans right now sets in to out,
        //to avoid one frame overlaps,
        //move outpoint by 0.001 seconds
        for (var i=0; i < length; i++) {
            if (srt[i].out == srt[i+1]['in']) {
                srt[i].out = srt[i].out - 0.001;
            }
        }
        return srt;
    }

    function setStatus(status) {
        $status.html(status);
    }

    selectLayer = Ox.Select({
            items: layers,
            title: Ox._('Select Layer'),
        })
        .css({
            margin: '4px 2px 4px 4px'
        })
        .bindEvent({
            change: function(data) {
                selectLayer.options({
                    title: null
                });
                layer = data.value;
                total && layer && importButton.options({disabled: false});
            }
        })
        .appendTo(content);

    selectFile = Ox.FileButton({
            image: 'upload',
            lbael: 'File',
            title: Ox._('Select SRT...'),
            width: 156
        })
        .css({
            margin: '4px 2px 4px 4px'
        })
        .bindEvent({
            click: function(data) {
                if (data.files.length) {
                    var reader = new FileReader();
                    reader.onloadend = function(event) {
                        srt = parseSRT(this.result);
                        total = srt.length;
                        if (total && layer) {
                            importButton.options({disabled: false});
                            selectLayer.hide();
                            selectFile.hide();
                        }
                        setStatus(
                            Ox._('File contains {0} annotation'
                            + (total == 1 ? '' : 's') + '.', [total])
                        );
                    };
                    reader.readAsText(data.files[0]);
                } else {
                    srt = [];
                    total = 0;
                    importButton.options({
                        disabled: true
                    });
                }
            }
        })
        .appendTo(content);

    return that;
};
