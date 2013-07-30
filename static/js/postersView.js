// FIXME: unused

'use strict';

pandora.ui.posterView = function() {

    var item = pandora.user.ui.item,
        view = pandora.user.ui.itemView,
        listWidth = 144 + Ox.UI.SCROLLBAR_SIZE,
        selectedImage = {};
        $preview = Ox.Element(),
        that = Ox.SplitPanel({
            elements: [
                {
                    element: Ox.Element(),
                    size: listWidth
                },
                {
                    element: $preview
                }
            ],
            orientation: 'horizontal'
        });

    that.resize = function() {
        selectedImage.url && renderPreview();
    }

    pandora.api.get({
        id: item,
        keys: [view]
    }, function(result) {
        var images = result.data[view];
        selectedImage = images.filter(function(image) {
            return image.selected;
        })[0];
        var $list = Ox.IconList({
                    item: function(data, sort, size) {
                        var ratio = data.width / data.height;
                        size = size || 128;
                        return {
                            height: ratio <= 1 ? size : size / ratio,
                            id: data['id'],
                            info: data.width + ' x ' + data.height + ' px',
                            title: view == 'frames' ? Ox.formatDuration(data.position) : data.source,
                            url: data.url,
                            width: ratio >= 1 ? size : size * ratio
                        }
                    },
                    items: images,
                    keys: view == 'frames'
                        ? ['index', 'position', 'width', 'height', 'url']
                        : ['index', 'source', 'width', 'height', 'url'],
                    max: 1,
                    min: 1,
                    orientation: 'vertical',
                    selected: [selectedImage['index']],
                    size: 128,
                    sort: [{key: 'index', operator: '+'}],
                    unique: 'index'
                })
                .css({background: 'rgb(16, 16, 16)'})
                .bindEvent({
                    select: function(event) {
                        var index = event.ids[0];
                        selectedImage = images.filter(function(image) {
                            return image.index == index;
                        })[0];
                        renderPreview(selectedImage);
                        pandora.api[view == 'frames' ? 'setPosterFrame' : 'setPoster'](Ox.extend({
                            id: item
                        }, view == 'frames' ? {
                            position: selectedImage.index // api slightly inconsistent
                        } : {
                            source: selectedImage.source
                        }), function(result) {
                            var imageRatio = selectedImage.width / selectedImage.height;
                            $('img[src*="/' + item + '/poster"]').each(function() {
                                var $this = $(this),
                                    size = Math.max($this.width(), $this.height()),
                                    src = $this.attr('src').split('?')[0] + '?' + Ox.uid();
                                $('<img>')
                                    .attr({src: src})
                                    .load(function() {
                                        $this.attr({src: src});
                                        view == 'posters' && $this.css(imageRatio < 1 ? {
                                            width: Math.round(size * imageRatio) + 'px',
                                            height: size + 'px'
                                        } : {
                                            width: size + 'px',
                                            height: Math.round(size / imageRatio) + 'px'
                                        });
                                    });
                            });
                        });
                    }
                });
        that.replaceElement(0, $list);
        renderPreview();
    });

    function renderPreview() {
        var previewWidth = pandora.$ui.document.width() - pandora.$ui.mainPanel.size(0) - 1 - listWidth,
            previewHeight = pandora.$ui.contentPanel.size(1),
            previewRatio = previewWidth / previewHeight,
            imageRatio = selectedImage.width / selectedImage.height,
            imageWidth = imageRatio > previewRatio ? previewWidth : Math.round(previewHeight * imageRatio),
            imageHeight = imageRatio < previewRatio ? previewHeight : Math.round(previewWidth / imageRatio),
            imageLeft = Math.floor((previewWidth - imageWidth) / 2),
            imageTop = Math.floor((previewHeight - imageHeight) / 2);
        $preview.html(
            $('<img>')
                .attr({
                    src: selectedImage.url
                })
                .css({
                    position: 'absolute',
                    left: imageLeft + 'px',
                    top: imageTop + 'px',
                    width: imageWidth + 'px',
                    height: imageHeight + 'px'
                })
        );
        if (view == 'frames') {
            var left = Math.floor((imageWidth - imageHeight) / 2),
                right = Math.ceil((imageWidth - imageHeight) / 2);
            $('<div>')
                .addClass('OxPosterMarker OxPosterMarkerLeft')
                .css({
                    display: 'block',
                    left: imageLeft + 'px',
                    top: imageTop + 'px',
                    width: left + 'px',
                    height: imageHeight + 'px'
                })
                .appendTo($preview.$element);
            $('<div>')
                .addClass('OxPosterMarker OxPosterMarkerCenter')
                .css({
                    display: 'block',
                    left: imageLeft + left + 'px',
                    top: imageTop + 'px',
                    width: imageHeight - 2 + 'px',
                    height: imageHeight - 2 + 'px'
                })
                .appendTo($preview.$element);
            $('<div>')
                .addClass('OxPosterMarker OxPosterMarkerRight')
                .css({
                    display: 'block',
                    left: imageLeft + left + imageHeight + 'px',
                    top: imageTop + 'px',
                    width: right + 'px',
                    height: imageHeight + 'px'
                })
                .appendTo($preview.$element);
        }
    }

    return that;

}
