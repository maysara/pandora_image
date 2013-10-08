// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.uploadDialog = function(data) {

    var cancelled = false,
        file,
        hasFirefogg = !(typeof Firefogg == 'undefined'),
        selectFile,
        $actionButton,
        $closeButton,
        $content = Ox.Element().css({margin: '16px'}),
        $info = $('<div>').css({padding: '4px'})
            .html(Ox._('Please select the video file you want to upload.')),
        $progress,
        $status = $('<div>').css({padding: '4px', paddingTop: '8px'}),
        that = Ox.Dialog({
            buttons: [
                $closeButton = Ox.Button({
                    id: 'close',
                    title: Ox._('Close')
                }).css({
                    float: 'left'
                }).bindEvent({
                    click: function() {
                        if ($closeButton.options('title') == Ox._('Cancel')) {
                            cancelled = true;
                            pandora.firefogg && pandora.firefogg.cancel();
                            pandora.$ui.upload && pandora.$ui.upload.abort();
                            $closeButton.options('title', Ox._('Close'));
                            $actionButton.show();
                        } else {
                            that.triggerEvent('close');
                        }
                    }
                }),
                $actionButton = hasFirefogg ? Ox.Button({
                    id: 'action',
                    title: Ox._('Select Video')
                }).bindEvent({
                    click: function() {
                        if ($actionButton.options('title') == Ox._('Select Video')) {
                            if (selectVideo()) {
                                $actionButton.options('title', Ox._('Upload'));
                            }
                        } else if ($actionButton.options('title') == Ox._('Cancel')) {
                            cancelled = true;
                            pandora.firefogg && pandora.firefogg.cancel();
                            pandora.$ui.upload && pandora.$ui.upload.abort();
                            $actionButton.options('title', Ox._('Select Video'));
                            $closeButton.show();
                        } else {
                            $closeButton.options('title', Ox._('Cancel'));
                            $actionButton.hide().options('title', Ox._('Select Video'));
                            encode();
                        }
                    }
                }) : Ox.FileButton({
                    id: 'action',
                    title: Ox._('Select Video'),
                    maxFiles: 1,
                    width: 96
                }).bindEvent({
                    click: function(data) {
                        if (data.files.length) {
                            $actionButton.hide();
                            $closeButton.options('title', Ox._('Cancel'));
                            upload(data.files[0]);
                        }
                    }
                })
            ],
            content: $content,
            height: 128,
            removeOnClose: true,
            width: 368,
            title: Ox._('Upload Video'),
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

    if (!pandora.site.itemRequiresVideo && !pandora.user.ui.item) {
        $info.html(Ox._(
            'You can only upload a video to an existing {0}.'
            + ' Please check if an entry for the {0}'
            + ' you want to upload exists and create otherwise.',
            [pandora.site.itemName.singular.toLowerCase()]
        ));
        $actionButton.hide();
    }
    $content.append($info);
    $content.append($status);

    function aspectratio(ratio) {
        var denominator, numerator;
        ratio = ratio.split(':');
        numerator = ratio[0];
        if (ratio.length == 2) {
            denominator = ratio[1];
        }
        if (Math.abs(numerator / denominator - 4/3) < 0.03) {
            numerator = 4;
            denominator = 3;
        } else if (Math.abs(numerator / denominator - 16/9) < 0.02) {
            numerator = 16;
            denominator = 9;
        }
        return {
            denominator: denominator,
            'float': numerator / denominator,
            numerator: numerator,
            ratio: numerator + ':' + denominator
        };
    }

    function resetProgress(status) {
        $progress = Ox.Progressbar({
            progress: 0,
            showPercent: true,
            showTime: true,
            width: 304
        });
        $status.html(status || '').append($progress);
    }

    function encode() {
        var filename = pandora.firefogg.sourceFilename,
            info = JSON.parse(pandora.firefogg.sourceInfo),
            item,
            oshash = info.oshash;
        $info.html('<b>' + filename + '</b><br>' + Ox._('encoding...'));
        resetProgress();
        pandora.api.addMedia({
            filename: filename,
            id: oshash,
            info: info,
            item: pandora.site.itemRequiresVideo ? undefined : pandora.user.ui.item
        }, function(result) {
            item = result.data.item;
            pandora.firefogg.encode(
                getEncodingOptions(info),
                function(result, file) {
                    result = JSON.parse(result);
                    if (result.progress != 1) {
                        $status.html(cancelled ? Ox._('Encoding cancelled.') : Ox._('Encoding failed.'));
                        delete pandora.firefogg;
                        return;
                    }
                    setTimeout(function() {
                        $info.html('<b>' + filename + '</b><br>' + Ox._('uploading...'));
                        uploadStream(item, oshash, file);
                    });
                },
                function(progress) {
                    progress = JSON.parse(progress).progress || 0;
                    $progress.options({progress: progress});
                }
            );
        });
    }

    function uploadStream(item, oshash, file) {
        var format = pandora.site.video.formats[0],
            resolution = Ox.max(pandora.site.video.resolutions);
        pandora.$ui.upload = pandora.chunkupload({
            file: file,
            url: '/api/upload/?profile=' + resolution + 'p.' + format + '&id=' + oshash,
            data: {}
        }).bindEvent({
            done: function(data) {
                if (data.progress == 1) {
                    Ox.Request.clearCache();
                    if (pandora.user.ui.item == item && pandora.user.ui.itemView == 'media') {
                        pandora.$ui.item.reload();
                    } else {
                        pandora.UI.set({
                            item: item,
                            itemView: 'media'
                        });
                    }
                    delete pandora.firefogg;
                    that.close();
                } else {
                    $status.html(Ox._('Upload Failed.'));
                    pandora.api.log({
                        text: data.responseText,
                        url: '/' + item,
                        line: 1
                    });
                }
            },
            progress: function(data) {
                $progress.options({progress: data.progress || 0});
            },
        });
    }

    function upload(file) {
        resetProgress();
        $info.html(Ox._('Uploading {0}', [file.name]));
        Ox.oshash(file, function(oshash) {
            pandora.api.addMedia({
                filename: file.name,
                id: oshash,
                item: pandora.site.itemRequiresVideo ? undefined : pandora.user.ui.item
            }, function(result) {
                var item = result.data.item;
                pandora.$ui.upload = pandora.chunkupload({
                    file: file,
                    url: '/api/upload/direct/',
                    data: {
                        id: oshash
                    }
                }).bindEvent({
                    done: function(data) {
                        if (data.progress == 1) {
                            Ox.Request.clearCache();
                            if (pandora.user.ui.item == item && pandora.user.ui.itemView == 'media') {
                                pandora.$ui.item.reload();
                            } else {
                                pandora.UI.set({
                                    item: item,
                                    itemView: 'media'
                                });
                            }
                            that.close();
                        } else {
                            $status.html(cancelled ? Ox._('Upload cancelled.') : Ox._('Upload failed.'));
                            !cancelled && pandora.api.log({
                                text: data.responseText,
                                url: '/' + item,
                                line: 1
                            });
                        }
                    },
                    progress: function(data) {
                        $progress.options({progress: data.progress || 0});
                    }
                });
            });
        });
    }

    function getEncodingOptions(info) {
        var bpp = 0.17,
            dar,
            format = pandora.site.video.formats[0],
            fps,
            options = {},
            resolution = Ox.max(pandora.site.video.resolutions);
        if (format == 'webm') {
            options.videoCodec = 'vp8';
            options.audioCodec = 'vorbis';
        } else if (format == 'ogv') {
            options.videoCodec = 'theora';
            options.audioCodec = 'vorbis';
        }
        if (resolution == 720) {
            options.height = 720;
            options.samplerate = 48000;
            options.audioQuality = 5;
        } else if (resolution == 480) {
            options.height = 480;
            options.samplerate = 44100;
            options.audioQuality = 3;
            options.channels = 2;
        } else if (resolution == 432) {
            options.height = 432;
            options.samplerate = 44100;
            options.audioQuality = 3;
            options.channels = 2;
        } else if (resolution == 360) {
            options.height = 320;
            options.samplerate = 44100;
            options.audioQuality = 1;
            options.channels = 1;
        } else if (resolution == 288) {
            options.height = 288;
            options.samplerate = 44100;
            options.audioQuality = 0;
            options.channels = 1;
        } else if (resolution == 240) {
            options.height = 240;
            options.samplerate = 44100;
            options.audioQuality = 0;
            options.channels = 1;
        } else if (resolution == 144) {
            options.height = 144;
            options.samplerate = 22050;
            options.audioQuality = -1;
            options.audioBitrate = 22;
            options.channels = 1;
        } else if (resolution == 96) {
            options.height = 96;
            options.samplerate = 22050;
            options.audioQuality = -1;
            options.audioBitrate = 22;
            options.channels = 1;
        }
        if (info.video && info.video[0].display_aspect_ratio) {
            dar = aspectratio(info.video[0].display_aspect_ratio);
            fps = aspectratio(info.video[0].framerate).float;
            options.width = parseInt(dar.float * options.height, 10);
            options.width += options.width % 2;
            // interlaced hdv material is detected with double framerates
            if (fps == 50) {
                options.framerate = 25;
            } else if (fps == 60) {
                options.framerate = 30;
            }
            if (Math.abs(options.width/options.height - dar.float) < 0.02) {
                options.aspect = options.width + ':' + options.height;
            } else {
                options.aspect = dar.ratio;
            }
            options.videoBitrate = Math.round(
                options.height * options.width * fps * bpp / 1000
            );
            options.denoise = true; 
            options.deinterlace = true; 
        } else {
            options.noVideo = true;
        }
        if (info.audio) {
            if (options.cannels && info.audio[0].channels < options.channels) {
                delete options.channels;
            }
        } else {
            options.noAudio = true;
            delete options.samplerate;
            delete options.audioQuality;
            delete options.channels;
        }
        options.noUpscaling = true;
        if (
            (!info.video.length || (
                info.video[0].codec == options.videoCodec
                && info.video[0].height <= options.height
            ))
            && (!info.audio.length || info.audio[0].codec == options.audioCodec)
        ) {
            options = {passthrough: true};
        }
        return JSON.stringify(options);
    }

    function formatInfo(info) {
        var html = '<b>' + info.path + '</b><br>';
        if (info.video && info.video.length > 0) {
            var video = info.video[0];
            html += video.width + '×' + video.height  + ' (' + video.codec + ')';
        }
        if (
            info.video && info.video.length > 0
            && info.audio && info.audio.length > 0
        ) {
            html += ' / ';
        }
        if (info.audio && info.audio.length > 0) {
            var audio = info.audio[0];
            html += {1: 'mono', 2: 'stereo', 6: '5.1'}[audio.channels]
                + ' ' + audio.samplerate / 1000 + ' kHz (' + audio.codec + ')';
        }
        html += '<br>' + Ox.formatValue(info.size, 'B')
            + ' / ' + Ox.formatDuration(info.duration);
        return html; 
    }

    function selectVideo() {
        cancelled = false;
        pandora.firefogg = new Firefogg();
        pandora.firefogg.setFormat(pandora.site.video.formats[0]);
        if (pandora.firefogg.selectVideo()) {
            var info = JSON.parse(pandora.firefogg.sourceInfo),
                options = JSON.parse(getEncodingOptions(info)),
                oshash = info.oshash,
                filename = pandora.firefogg.sourceFilename,
                item;
            pandora.api.findMedia({
                query: {
                    conditions: [{key: 'oshash', value: oshash}]
                },
                keys: ['id', 'available']
            }, function(result) {
                if (
                    result.data.items.length === 0
                    || !result.data.items[0].available
                ) {
                    $info.html(formatInfo(info));
                    $status.html(
                        options.passthrough
                        ? Ox._('Your video will be uploaded directly.')
                        : Ox._('Your video will be transcoded before upload.')
                    );
                } else {
                    pandora.api.find({
                        query: {
                            conditions: [{key: 'oshash', value: oshash}]
                        },
                        keys: ['id']
                    }, function(result) {
                        pandora.UI.set({
                            item: result.data.items[0].id,
                            itemView: 'media'
                        });
                        delete pandora.firefogg;
                        that.close();
                    });
                }
            });
            return true;
        }
        return false;
    }

    return that;

};
