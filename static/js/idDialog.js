'use strict';

pandora.ui.idDialog = function(data) {

    data = Ox.clone(data, true);

    var originalData = Ox.clone(data, true),

        dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),
        formWidth = getFormWidth(),

        $content,
        $input = [],
        $checkboxGroup,

        that = Ox.Dialog({
                buttons: [
                    Ox.Button({
                            distabled: true,
                            id: 'switch',
                            title: Ox._('Update Metadata...')
                        })
                        .bindEvent({
                            click: function() {
                                that.close();
                                pandora.$ui.metadataDialog = pandora.ui.metadataDialog(originalData).open();
                            }
                        }),
                    {},
                    Ox.Button({
                            id: 'cancel',
                            title: Ox._('Don\'t Update')
                        })
                        .bindEvent({
                            click: function() {
                                that.close();
                            }
                        }),
                    Ox.Button({
                            disabled: true,
                            id: 'update',
                            title: Ox._('Update IMDb ID')
                        })
                        .bindEvent({
                            click: updateId
                        })
                ],
                closeButton: true,
                content: Ox.LoadingScreen(),
                height: dialogHeight,
                maximizeButton: true,
                minHeight: 256,
                minWidth: 512,
                removeOnClose: true,
                title: Ox._('Update IMDb ID'),
                width: dialogWidth
            })
            .bindEvent({
                resize: setSize
            });

    getIds();

    function getFormWidth() {
        return dialogWidth - 32 - Ox.UI.SCROLLBAR_SIZE;
    }

    function getIds() {
        var get = {};
        ['title', 'director', 'year'].forEach(function(key) {
            if (!Ox.isEmpty(data[key])) {
                get[key] = data[key];
            }
        });
        pandora.api.getIds(get, function(result) {
            var checkboxes = [];
            if (!data.imdbId) {
                checkboxes.push(
                    {
                        id: 'none',
                        title: getTitle({
                            id: data.imdbId,
                            title: data.title,
                            director: data.director,
                            year: data.year
                        })
                    }
                );
            }
            $content = Ox.Element()
                .css({padding: '13px', overflowY: 'auto'});
            ['title', 'director', 'year'].forEach(function(key) {
                $input.push(
                    Ox.Input({
                        label: Ox.toTitleCase(key),
                        labelWidth: 128,
                        value: Ox.decodeHTMLEntities(key == 'director' && data[key]
                            ? data[key].join(', ')
                            : ('' + data[key])),
                        width: formWidth
                    })
                    .css({display: 'inline-block', margin: '3px'})
                    .bindEvent({
                        change: function(data_) {
                            data[key] = key == 'director'
                                ? data_.value.split(', ')
                                : data_.value;
                            that.options({content: Ox.LoadingScreen()});
                            getIds();
                        }
                    })
                    .appendTo($content)
                );
            });
            $('<div>')
                 .css({width: '1px', height: '8px'})
                 .appendTo($content);
            (
                data.imdbId
                && Ox.getIndexById(result.data.items, data.imdbId) == -1
                ? pandora.api.findId
                : Ox.noop
            )({id: data.imdbId}, function(result_) {
                if (result_ && result_.data.items.length) {
                    checkboxes.push(
                        {
                            id: data.imdbId,
                            title: getTitle(result_.data.items[0])
                        }
                    )
                }
                checkboxes = checkboxes.concat(
                    result.data.items.map(function(item) {
                        return {
                            id: item.id,
                            title: getTitle(item)
                        };
                    })
                );
                $checkboxGroup = Ox.CheckboxGroup({
                        checkboxes: checkboxes,
                        type: 'list',
                        width: formWidth,
                        value: !data.imdbId ? 'none' : data.imdbId
                    })
                    .css({display: 'inline-block', margin: '3px'})
                    .bindEvent({
                        change: updateButton
                    })
                    .appendTo($content);
                var elements = $checkboxGroup.find('.OxCheckbox:not(.OxButton)');
                checkboxes.forEach(function(checkbox, index) {
                    if (checkbox.id != 'none') {
                        Ox.Button({
                                title: 'arrowRight',
                                tooltip: Ox._('View on IMDb'),
                                type: 'image'
                            })
                            .css({
                                float: 'right',
                                marginTop: '-18px'
                            })
                            .bindEvent({
                                click: function() {
                                    window.open('/url=' + encodeURIComponent(
                                        'http://imdb.com/title/tt'
                                        + checkbox.id + '/combined'
                                    ), '_blank');
                                }
                            })
                            .appendTo(elements[index]);
                    }
                });
                that.options({content: $content});
                updateButton();
            });
        });
    }

    function getTitle(item) {
        item = Ox.clone(item, true);
        if (item.id && item.id == data.imdbId) {
            item.id = highlightTitle(item.id);
        }
        if (item.title == data.title) {
            item.title = highlightTitle(item.title);
        }
        if (item.originalTitle == data.title) {
            item.originalTitle = highlightTitle(item.originalTitle);
        }
        if (item.director) {
            item.director.forEach(function(director, i) {
                if (Ox.contains(data.director, director)) {
                    item.director[i] = highlightTitle(director);
                }
            })
        }
        if (item.year && item.year == data.year) {
            item.year = highlightTitle(item.year);
        }
        return Ox.filter([
            item.id,
            item.title + (item.originalTitle ? ' (' + item.originalTitle + ')' : ''),
            item.director ? item.director.join(', ') : '',
            item.year
        ]).join(' &mdash; ');
    }

    function highlightTitle(value) {
        return '<span style="font-weight: bold">' + value + '</span>';
    }

    function isEmpty(value) {
        return Ox.isEmpty(value) || Ox.isUndefined(value);
    }

    function setSize(data) {
        dialogHeight = data.height;
        dialogWidth = data.width;
        formWidth = getFormWidth();
        $input.forEach(function($element) {
            $element.options({width: formWidth});
        });
        $checkboxGroup.options({width: formWidth});
    }

    function updateButton() {
        that[
            $checkboxGroup.options('value') == data.imdbId || (
                $checkboxGroup.options('value') == 'none' && !data.imdbId
            ) ? 'disableButton' : 'enableButton'
        ]('update');
    }

    function updateId() {
        that.options({content: Ox.LoadingScreen()}).disableButtons();
        pandora.api.edit({
            id: data.id,
            imdbId: $checkboxGroup.options('value')
        }, function(result) {
            that.close();
            pandora.updateItemContext();
            pandora.$ui.contentPanel.replaceElement(1,
                pandora.$ui.item = pandora.ui.item()
            );
        });
    }

    return that;

};
