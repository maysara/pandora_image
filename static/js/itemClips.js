'use strict';

pandora.ui.itemClips = function(options) {

    var self = {},
        that = Ox.Element()
            .css({
                height: '192px',
                margin: '4px'
            })
            .bindEvent({
                doubleclick: doubleclick,
                singleclick: singleclick
            });

    self.options = Ox.extend({
        clips: [],
        duration: 0,
        id: '',
        ratio: 8/5
    }, options);

    self.size = 128;
    self.width = self.options.ratio > 1 ? self.size : Math.round(self.size * self.options.ratio);
    self.height = self.options.ratio > 1 ? Math.round(self.size / self.options.ratio) : self.size;

    self.options.clips.forEach(function(clip, i) {
        var annotations = clip.annotations.sort(function(a, b) {
                var layerA = pandora.site.clipLayers.indexOf(a.layer),
                    layerB = pandora.site.clipLayers.indexOf(b.layer);
                return layerA < layerB ? -1
                    : layerA > layerB ? 1
                    : a.value < b.value ? -1
                    : a.value > b.value ? 1
                    : 0;
            }),
            url = '/' + self.options.id + '/' + self.height + 'p' + clip['in'] + '.jpg',
            $item = Ox.IconItem({
                find: pandora.user.ui.itemFind,
                imageHeight: self.height,
                imageWidth: self.width,
                id: clip.id,
                info: Ox.formatDuration(clip['in']) + ' - ' + Ox.formatDuration(clip.out),
                title: annotations.map(function(annotation) {
                    return Ox.stripTags(annotation.value.replace(/\n/g, ' '));
                }).join('; '),
                url: url
            })
            .addClass('OxInfoIcon')
            .css({
                float: 'left',
                margin: i == 0 ? '2px 2px 2px -2px'
                    : i == self.options.clips.length - 1 ? '2px -2px 2px 2px'
                    : '2px'
            })
            .data(
                // default 5 second clips are annotations without id
                Ox.extend(annotations.length && annotations[0].id ? {
                    annotation: annotations[0].id.split('/')[1]
                } : {}, {'in': clip['in'], out: clip.out})
            );
        $item.find('.OxTarget').addClass('OxSpecialTarget');
        that.append($item);
    });

    function doubleclick(data) {
        var $item, $target = $(data.target), annotation, item, points, set;
        if ($target.parent().parent().is('.OxSpecialTarget')) {
            // for videos, the click registers deeper inside
            $target = $target.parent().parent();
        }
        if ($target.is('.OxSpecialTarget')) {
            $item = $target.parent().parent();
            item = self.options.id;
            annotation = $item.data('annotation');
            points = [$item.data('in'), $item.data('out')];
            set = {};
            set['videoPoints.' + item] = Ox.extend(annotation ? {
                annotation: annotation
            } : {}, {
                'in': points[0],
                out: points[1],
                position: points[0]
            });
            pandora.UI.set(set);
        }
    }

    function singleclick(data) {
        var $img, $item, $target = $(data.target), points;
        if ($target.is('.OxSpecialTarget')) {
            $item = $target.parent().parent();
            $img = $item.find('.OxIcon > img');
            points = [$item.data('in'), $item.data('out')];
            if ($img.length) {
                pandora.api.get({id: self.options.id, keys: ['durations', 'rightslevel']}, function(result) {
                    var partsAndPoints = pandora.getVideoPartsAndPoints(
                            result.data.durations, points
                        ),
                        $player = Ox.VideoPlayer({
                            censored: pandora.site.capabilities.canPlayClips[pandora.user.level] < result.data.rightslevel
                                ? [{'in': partsAndPoints.points[0], out: partsAndPoints.points[1]}]
                                : [],
                            enableMouse: true,
                            height: self.height,
                            'in': partsAndPoints.points[0],
                            out: partsAndPoints.points[1],
                            playInToOut: true,
                            poster: '/' + self.options.id + '/' + self.height + 'p' + points[0] + '.jpg',
                            rewind: true,
                            video: partsAndPoints.parts.map(function(i) {
                                return pandora.getVideoURL(self.options.id, Ox.min(pandora.site.video.resolutions), i + 1);
                            }),
                            width: self.width
                        })
                        .addClass('OxTarget OxSpecialTarget');
                        $img.replaceWith($player.$element);
                });
            }
        }
    }

    return that;

};
