'use strict';

pandora.ui.infoView = function(data) {

    // fixme: given that currently, the info view doesn't scroll into view nicely
    // when collapsing the movies browser, the info view should become a split panel

    var ui = pandora.user.ui,
        canEdit = pandora.site.capabilities.canEditMetadata[pandora.user.level],
        canRemove = pandora.site.capabilities.canRemoveItems[pandora.user.level],
        canSeeAllMetadata = pandora.user.level != 'guest',
        css = {
            marginTop: '4px',
            textAlign: 'justify'
        },
        iconRatio = ui.icons == 'posters' ? (
            ui.showSitePosters ? pandora.site.posters.ratio : data.posterRatio
        ) : 1,
        iconSize = ui.infoIconSize,
        iconWidth = iconRatio > 1 ? iconSize : Math.round(iconSize * iconRatio),
        iconHeight = iconRatio < 1 ? iconSize : Math.round(iconSize / iconRatio),
        iconLeft = iconSize == 256 ? Math.floor((iconSize - iconWidth) / 2) : 0,
        borderRadius = ui.icons == 'posters' ? 0 : iconSize / 8,
        isEditable = canEdit && data.id.slice(0, 2) == '0x',
        listWidth = 144 + Ox.UI.SCROLLBAR_SIZE,
        margin = 16,
        statisticsWidth = 128,

        $bar = Ox.Bar({size: 16})
            .bindEvent({
                doubleclick: function(e) {
                    if ($(e.target).is('.OxBar')) {
                        $data.animate({scrollTop: 0}, 250);
                    }
                }
            }),

        $options = Ox.MenuButton({
                items: [
                    {
                        id: 'update',
                        title: Ox._('Update Metadata'),
                        disabled: !canEdit || isEditable
                    },
                    {},
                    {
                        id: 'delete',
                        title: Ox._('Delete {0}...', [pandora.site.itemName.singular]),
                        disabled: !canRemove
                    }
                ],
                style: 'square',
                title: 'set',
                tooltip: Ox._('Options'),
                type: 'image',
            })
            .css({
                float: 'left',
                borderColor: 'rgba(0, 0, 0, 0)',
                background: 'rgba(0, 0, 0, 0)'
            })
            .bindEvent({
                click: function(data) {
                    if (data.id == 'update') {
                        updateMetadata();
                    } else if (data.id == 'delete') {
                        pandora.$ui.deleteItemDialog = pandora.ui.deleteItemDialog(data).open();
                    }
                }
            })
            .appendTo($bar),

        $edit = Ox.MenuButton({
                items: [
                    {
                        id: 'insert',
                        title: Ox._('Insert HTML...'),
                        disabled: true
                    }
                ],
                style: 'square',
                title: 'edit',
                tooltip: Ox._('Edit'),
                type: 'image',
            })
            .css({
                float: 'right',
                borderColor: 'rgba(0, 0, 0, 0)',
                background: 'rgba(0, 0, 0, 0)'
            })
            .bindEvent({
                click: function(data) {
                    // ...
                }
            })
            .appendTo($bar),

        $main = Ox.Element(),

        that = Ox.SplitPanel({
            elements: [
                {element: $bar, size: 16},
                {element: $main}
            ],
            orientation: 'vertical'
        }),

        $list,

        $info = $('<div>')
            .css({
                position: 'absolute',
                left: canEdit && !ui.showIconBrowser ? -listWidth + 'px' : 0,
                top: 0,
                right: 0
            })
            .appendTo($main),

        $data = Ox.Container()
            .css({
                position: 'absolute',
                left: (canEdit ? listWidth : 0) + 'px',
                top: 0,
                right: 0,
                height: getHeight() + 'px'
            })
            .appendTo($info),

        $icon = Ox.Element({
                element: '<img>',
                tooltip: canEdit ? (
                    !ui.showIconBrowser
                        ? Ox._('Doubleclick to edit icon')
                        : Ox._('Doubleclick to hide icons')
                ) : ''
            })
            .attr({
                src: '/' + data.id + '/' + (
                    ui.icons == 'posters'
                    ? (ui.showSitePosters ? 'siteposter' : 'poster') : 'icon'
                ) + '512.jpg?' + data.modified
            })
            .css({
                position: 'absolute',
                left: margin + iconLeft + 'px',
                top: margin + 'px',
                width: iconWidth + 'px',
                height: iconHeight + 'px',
                borderRadius: borderRadius + 'px',
                cursor: 'pointer'
            })
            .bindEvent({
                singleclick: toggleIconSize
            })
            .appendTo($data.$element),

        $reflection = $('<div>')
            .addClass('OxReflection')
            .css({
                position: 'absolute',
                left: margin + 'px',
                top: margin + iconHeight + 'px',
                width: iconSize + 'px',
                height: Math.round(iconSize / 2) + 'px',
                overflow: 'hidden'
            })
            .appendTo($data.$element),

        $reflectionIcon = $('<img>')
            .attr({
                src: '/' + data.id + '/' + (
                    ui.icons == 'posters'
                    ? (ui.showSitePosters ? 'siteposter' : 'poster') : 'icon'
                ) + '512.jpg?' + data.modified
            })
            .css({
                position: 'absolute',
                left: iconLeft + 'px',
                width: iconWidth + 'px',
                height: iconHeight + 'px',
                borderRadius: borderRadius + 'px'
            })
            .appendTo($reflection),

        $reflectionGradient = $('<div>')
            .css({
                position: 'absolute',
                width: iconSize + 'px',
                height: Math.round(iconSize / 2) + 'px'
            })
            .appendTo($reflection),

        $text = Ox.Element()
            .addClass('OxTextPage')
            .css({
                position: 'absolute',
                left: margin + (iconSize == 256 ? 256 : iconWidth) + margin + 'px',
                top: margin + 'px',
                right: margin + statisticsWidth + margin + 'px'
            })
            .appendTo($data.$element),

        $statistics = $('<div>')
            .css({
                position: 'absolute',
                width: statisticsWidth + 'px',
                top: margin + 'px',
                right: margin + 'px'
            })
            .appendTo($data.$element),

        $reloadButton,

        $capabilities,

        $browserImages = [];

    [$options, $edit].forEach(function($element) {
        $element.find('input').css({
            borderWidth: 0,
            borderRadius: 0,
            padding: '3px'
        });
    });

    pandora.createLinks($text);

    // Title -------------------------------------------------------------------

    $('<div>')
        .css({
            marginTop: '-2px'
        })
        .append(
            Ox.EditableContent({
                    clickLink: pandora.clickLink,
                    editable: isEditable,
                    format: function(value) {
                        return formatTitle(value);
                    },
                    tooltip: isEditable ? pandora.getEditTooltip() : '',
                    value: data.title
                })
                .css({
                    marginBottom: '-3px',
                    fontWeight: 'bold',
                    fontSize: '13px'
                })
                .bindEvent({
                    submit: function(event) {
                        editMetadata('title', event.value);
                    }
                })
        )
        .appendTo($text);

    // Director ----------------------------------------------------------------

    if (data.director || isEditable) {
        $('<div>')
            .css({
                marginTop: '2px'
            })
            .append(
                Ox.EditableContent({
                        clickLink: pandora.clickLink,
                        editable: isEditable,
                        format: function(value) {
                            return formatValue(value.split(', '), 'name');
                        },
                        placeholder: formatLight(Ox._('Unknown Director')),
                        tooltip: isEditable ? pandora.getEditTooltip() : '',
                        value: data.director ? data.director.join(', ') : ''
                    })
                    .css({
                        marginBottom: '-3px',
                        fontWeight: 'bold',
                        fontSize: '13px'
                    })
                    .bindEvent({
                        submit: function(event) {
                            editMetadata('director', event.value);
                        }
                    })
            )
            .appendTo($text);
    }

    // Country, Year, Language, Runtime, Color, Sound --------------------------

    if (isEditable) {
        var $div = $('<div>')
            .addClass('OxSelectable')
            .css(css)
            .appendTo($text);
        ['country', 'year'].forEach(function(key, i) {
            i && $('<div>').css({float: 'left'}).html(';&nbsp;').appendTo($div);
            $('<div>')
                .css({float: 'left'})
                .html(formatKey(key).replace('</span>', '&nbsp;</span>'))
                .appendTo($div);
            Ox.EditableContent({
                    clickLink: pandora.clickLink,
                    format: function(value) {
                        return formatValue(value.split(', '), key)
                    },
                    placeholder: formatLight('unknown'),
                    tooltip: pandora.getEditTooltip(),
                    value: key == 'country'
                        ? (data[key] ? data[key].join(', ') : [''])
                        : data[key] || ''
                })
                .css({float: 'left'})
                .bindEvent({
                    submit: function(event) {
                        editMetadata(key, event.value);
                    }
                })
                .appendTo($div);
        });
    } else if (data.country || data.year || data.language || data.runtime || data.color || data.sound) {
        var html = [];
        ['country', 'year', 'language', 'runtime', 'color', 'sound'].forEach(function(key) {
            if (data[key]) {
                html.push(
                    formatKey(key) + (
                        key != 'runtime' ? formatValue(data[key], key)
                        : data[key] < 60 ? Math.round(data[key]) + '&nbsp;sec'
                        : Math.round(data[key] / 60) + '&nbsp;min'
                    )
                )
            }
        });
        $('<div>')
            .addClass('OxSelectable')
            .css(css)
            .html(html.join('; '))
            .appendTo($text);
    }

    // Alternative Titles ------------------------------------------------------

    // FIXME: This should be an array of objects {title: '', info: ''}
    data.alternativeTitles && $('<div>')
        .addClass('OxSelectable')
        .css(css)
        .html(
            formatKey('Alternative Title' + (data.alternativeTitles.length == 1 ? '' : 's'))
            + data.alternativeTitles.map(function(value) {
                return value[0] + (
                    canSeeAllMetadata && Ox.isArray(value[1])
                    ? ' ' + formatLight('(' + value[1].join(', ') + ')')
                    : ''
                );
            }).join(', ')
        )
        .appendTo($text);

    // FIXME: we will want to check for data.seriesId here
    if (isEditable && data.seriesTitle) {
        var $div = $('<div>')
            .addClass('OxSelectable')
            // FIXME: Don't extend!
            .css(Ox.extend(css, {marginTop: '20px'})) // FIXME: just a guess
            .appendTo($text);
        ['episodeDirector', 'seriesYear'].forEach(function(key, i) {
            i && $('<div>').css({float: 'left'}).html(';&nbsp;').appendTo($div);
            $('<div>')
                .css({float: 'left'})
                .html(formatKey(Ox.toUnderscores(key).replace(/_/g, ' ')).replace('</span>', '&nbsp;</span>'))
                .appendTo($div);
            Ox.Editable({
                    clickLink: pandora.clickLink,
                    format: function(value) {
                        return formatValue(
                            value.split(', '),
                            key == 'episodeDirector' ? 'name' : 'year'
                        );
                    },
                    placeholder: formatLight('unknown'),
                    tooltip: pandora.getEditTooltip(),
                    value: key == 'episodeDirector'
                        ? (data[key] ? data[key].join(', ') : [''])
                        : data[key] || ''
                })
                .css({float: 'left'})
                .bindEvent({
                    submit: function(event) {
                        editMetadata(key, event.value);
                    }
                })
                .appendTo($div);
        });
    } else if (data.episodeDirector || data.writer || data.producer || data.cinematographer || data.editor) {
        $div = $('<div>')
            .addClass('OxSelectable')
            .css(css)
            .appendTo($text);
        html = [];
        ['episodeDirector', 'writer', 'producer', 'cinematographer', 'editor'].forEach(function(key) {
            data[key] && html.push(
                formatKey(key == 'episodeDirector' ? 'director' : key) + formatValue(data[key], 'name')
            );
        });
        $div.html(html.join('; '));
    }

    data.cast && $('<div>')
        .addClass('OxSelectable')
        .css(css)
        .html(
            formatKey('cast') + data.cast.map(function(value) {
                // FIXME: 'uncredited' should be removed on the backend
                value.character = value.character.replace('(uncredited)', '').trim();
                return formatValue(value.actor, 'name')
                    + (
                        canSeeAllMetadata && value.character
                        ? ' ' + formatLight('(' + value.character + ')')
                        : ''
                    );
            }).join(', ')
        )
        .appendTo($text);

    data.productionCompany && $('<div>')
        .addClass('OxSelectable')
        .css(css)
        .html(
            formatKey('studio')
            + formatValue(data.productionCompany, 'productionCompany')
        )
        .appendTo($text);

    if (data.genre || (data.keyword && canSeeAllMetadata)) {
        $div = $('<div>')
            .addClass('OxSelectable')
            .css(css)
            .appendTo($text);
        html = [];
        (canSeeAllMetadata ? ['genre', 'keyword'] : ['genre']).forEach(function(key) {
            data[key] && html.push(
                formatKey(key == 'keyword' ? 'keywords' : key)
                + formatValue(data[key], key)
            );
        });
        $div.html(html.join('; '));
    }

    data.summary && $('<div>')
        .addClass('OxSelectable')
        .css(css)
        .html(formatKey('summary') + data.summary)
        .appendTo($text);

    if (canSeeAllMetadata) {
        
        data.trivia && data.trivia.forEach(function(value) {
            $('<div>')
                .css({
                    display: 'table-row'
                })
                .append(
                    $('<div>')
                        .css({
                            display: 'table-cell',
                            width: '12px',
                            paddingTop: '4px'
                        })
                        .html('<span style="font-weight: bold">&bull;</span>')
                )
                .append(
                    $('<div>')
                        .addClass('OxSelectable')
                        .css({
                            display: 'table-cell',
                            paddingTop: '4px',
                            textAlign: 'justify'
                        })
                        .html(value)
                )
                .append(
                    $('<div>').css({clear: 'both'})
                )
                .appendTo($text);
        });

        data.filmingLocations && $('<div>')
            .addClass('OxSelectable')
            .css(css)
            .html(
                formatKey(Ox._('Filming Locations')) + data.filmingLocations.map(function(location) {
                    return  '<a href="/map/@' + location + '">' + location + '</a>'
                }).join('; ')
            )
            .appendTo($text);

        data.releasedate && $('<div>')
            .addClass('OxSelectable')
            .css(css)
            .html(
                formatKey(Ox._('Release Date')) + Ox.formatDate(data.releasedate, '%A, %B %e, %Y')
            )
            .appendTo($text);

        if (data.budget || data.gross || data.profit) {
            $div = $('<div>')
                .addClass('OxSelectable')
                .css(css)
                .appendTo($text);
            html = [];
            ['budget', 'gross', 'profit'].forEach(function(key) {
                data[key] && html.push(
                    formatKey(key == 'profit' && data[key] < 0 ? 'loss' : key)
                    + Ox.formatCurrency(Math.abs(data[key]), '$')
                );
            });
            $div.html(html.join('; '));
        }

        if (data.connections) {
            $div = $('<div>')
                .addClass('OxSelectable')
                .css(css)
                .appendTo($text);
            html = [];
            [
                'Edited from', 'Edited into',
                'Features', 'Featured in',
                'Follows', 'Followed by',
                'References', 'Referenced in',
                'Remake of', 'Remade as',
                'Spin off from', 'Spin off',
                'Spoofs', 'Spoofed in'
            ].forEach(function(key) {
                data.connections[key] && html.push(
                    formatKey(key) + data.connections[key].map(function(connection) {
                        return (
                            connection.item
                                ? '<a href="/' + connection.item + '">' + connection.title + '</a>'
                                : connection.title
                        ) + (
                            connection.description
                                ? ' ' + formatLight('(' + connection.description + ')')
                                : ''
                        );
                    }).join(', ')
                );
            });
            $div.html(html.join('; '));
        }

    }

    ['reviews', 'links'].forEach(function(key) {
        data[key] && $('<div>')
            .addClass('OxSelectable')
            .css(css)
            .html(
                formatKey(key) + data[key].map(function(value) {
                    return '<a href="' + value.url + '">' + value.source + '</a>'
                }).join(', ')
            )
            .appendTo($text);
    });

    $('<div>').css({height: '16px'}).appendTo($text);

    // Mainstream Score, Arthouse Score ----------------------------------------

    ['votes', 'likes'].forEach(function(key) {
        var value = data[key] || 0;
        $('<div>')
            .css({marginBottom: '4px'})
            .append(
                formatKey(
                    key == 'votes' ? 'Mainstream Score' : 'Arthouse Score',
                    'statistics'
                )
            )
            .append(
                Ox.Theme.formatColorPercent(value, 1, true)
                    .css({textAlign: 'right', cursor: 'pointer'})
                    .bind({
                        click: function() {
                            pandora.UI.set({listSort: [{
                                key: key,
                                operator: pandora.getSortOperator(key)
                            }]});
                        }
                    })
            )
            .appendTo($statistics);
    });

    // Duration, Aspect Ratio --------------------------------------------------

    ['duration', 'aspectratio'].forEach(function(key) {
        var itemKey = Ox.getObjectById(pandora.site.itemKeys, key),
            value = data[key] || 0;
        $('<div>')
            .css({marginBottom: '4px'})
            .append(formatKey(itemKey.title, 'statistics'))
            .append(
                Ox.Theme.formatColor(null, 'gradient')
                    .css({textAlign: 'right', cursor: 'pointer'})
                    .html(
                        Ox['format' + Ox.toTitleCase(itemKey.format.type)]
                            .apply(null, [value].concat(itemKey.format.args))
                    )
                    .bind({
                        click: function() {
                            pandora.UI.set({listSort: [{
                                key: key,
                                operator: pandora.getSortOperator(key)
                            }]});
                        }
                    })
            )
            .appendTo($statistics);
    });

    // Hue, Saturation, Lightness, Volume --------------------------------------

    ['hue', 'saturation', 'lightness', 'volume'].forEach(function(key) {
        var value = data[key] || 0;
        $('<div>')
            .css({marginBottom: '4px'})
            .append(formatKey(key, 'statistics'))
            .append(
                Ox.Theme.formatColor(value, key == 'volume' ? 'lightness' : key)
                    .css({textAlign: 'right', cursor: 'pointer'})
                    .bind({
                        click: function() {
                            pandora.UI.set({listSort: [{
                                key: key,
                                operator: pandora.getSortOperator(key)
                            }]});
                        }
                    })
            )
            .appendTo($statistics);
    });

    // Cuts per Minute, Words per Minute ---------------------------------------

    ['cutsperminute', 'wordsperminute'].forEach(function(key) {
        var value = data[key] || 0;
        $('<div>')
            .css({marginBottom: '4px'})
            .append(
                formatKey(key.slice(0, -9) + ' per minute', 'statistics')
            )
            .append(
                Ox.Theme.formatColor(null, 'gradient')
                    .css({textAlign: 'right', cursor: 'pointer'})
                    .html(Ox.formatNumber(value, 3))
                    .bind({
                        click: function() {
                            pandora.UI.set({listSort: [{
                                key: key,
                                operator: pandora.getSortOperator(key)
                            }]});
                        }
                    })
            )
            .appendTo($statistics);
    });

    // Rights Level ------------------------------------------------------------

    var $rightsLevel = $('<div>');
    $('<div>')
        .css({marginBottom: '4px'})
        .append(formatKey('Rights Level', 'statistics'))
        .append($rightsLevel)
        .appendTo($statistics);
    renderRightsLevel();

    // Notes -------------------------------------------------------------------

    if (canEdit) {
        $('<div>')
            .css({marginBottom: '4px'})
            .append(formatKey('Notes', 'statistics'))
            .append(
                Ox.EditableContent({
                        clickLink: pandora.clickLink,
                        placeholder: formatLight(Ox._('No notes')),
                        tooltip: pandora.getEditTooltip(),
                        type: 'textarea',
                        value: data.notes || '',
                        width: 128
                    })
                    .bindEvent({
                        submit: function(event) {
                            pandora.api.edit({
                                id: data.id,
                                notes: event.value
                            }, function(result) {
                                // ...
                            });
                        }
                    })
            )
            .appendTo($statistics);
    }

    $('<div>').css({height: '16px'}).appendTo($statistics);

    if (canEdit) {
        $icon.bindEvent({
            doubleclick: function() {
                pandora.UI.set({showIconBrowser: !ui.showIconBrowser});
                $info.animate({
                    left: ui.showIconBrowser ? 0 : -listWidth + 'px'
                }, 250);
                $icon.options({
                    tooltip: !pandora.user.ui.showIconBrowser
                        ? 'Doubleclick to edit icon'
                        : 'Doubleclick to hide icons'
                });
            }
        });
        renderList();
    }

    function editMetadata(key, value) {
        if (value != data[key]) {
            var edit = {id: data.id};
            if (key == 'title') {
                Ox.extend(edit, parseTitle(value));
            } else if (['director', 'country'].indexOf(key) > -1) {
                edit[key] = value ? value.split(', ') : [];
            } else {
                edit[key] = value;
            }
            pandora.api.edit(edit, function(result) {
                if (result.data.id != data.id) {
                    Ox.Request.clearCache(); // fixme: too much
                    pandora.UI.set({item: result.data.id});
                    pandora.$ui.browser.value(data.id, 'id', result.data.id);
                    // FIXME: does this update selected?
                }
                pandora.updateItemContext();
                pandora.$ui.browser.value(result.data.id, key, result.data[key]);
            });
        }
    }

    function formatKey(key, mode) {
        var item = Ox.getObjectById(pandora.site.itemKeys, key);
        key = Ox._(item ? item.title : key);
        mode = mode || 'text';
        return mode == 'text'
            ? '<span style="font-weight: bold">' + Ox._(Ox.toTitleCase(key)) + ':</span> '
            : $('<div>').css({marginBottom: '4px', fontWeight: 'bold'})
                .html(Ox._(Ox.toTitleCase(key).replace(' Per ', ' per ')))
    }

    function formatLight(str) {
        return '<span class="OxLight">' + str + '</span>';
    }

    function formatTitle(title) {
        var match = /(.+) (\(S\d{2}E\d{2}\))/.exec(title);
        if (match) {
            title = formatValue(match[1], 'title') + ' '
                + formatLight(match[2])
                + title.substr(match[0].length);
        }
        return title + (
            data.originalTitle && data.originalTitle != title
            ? ' ' + formatLight('(' + data.originalTitle + ')') : ''
        );
    }

    function formatValue(value, key) {
        return (Ox.isArray(value) ? value : [value]).map(function(value) {
            return key ?
                '<a href="/' + key + '=' + value + '">' + value + '</a>'
                : value;
        }).join(', ');
    }

    function getHeight() {
        return pandora.$ui.contentPanel.size(1) - 16;
    }

    function getRightsLevelElement(rightsLevel) {
        return Ox.Theme.formatColorLevel(
            rightsLevel,
            pandora.site.rightsLevels.map(function(rightsLevel) {
                return rightsLevel.name;
            })
        );
    }

    function parseTitle(title) {
        var data = {title: title},
            match = /(\(S(\d{2})E(\d{2})\))/.exec(title),
            episodeMatch = /(.+) \(S01\) (.+)/.exec(title),
            split;
        if (match) {
            data.season = parseInt(match[2], 10);
            data.episode = parseInt(match[3], 10);
            split = title.split(match[1]);
            data.seriesTitle = split[0].trim();
            data.episodeTitle = split[1].trim();
        } else if (episodeMatch) {
            data.seriesTitle = episodeMatch[1].trim();
            data.episodeTitle = episodeMatch[2].trim();
            data.season = 1;
        }
        return data;
    }

    function renderCapabilities(rightsLevel) {
        var capabilities = [].concat(
                canEdit ? [{name: 'canSeeItem', symbol: 'Find'}] : [],
                [
                    {name: 'canPlayClips', symbol: 'PlayInToOut'},
                    {name: 'canPlayVideo', symbol: 'Play'},
                    {name: 'canDownloadVideo', symbol: 'Download'}
                ]
            ),
            userLevels = canEdit ? pandora.site.userLevels : [pandora.user.level];
        $capabilities.empty();
        userLevels.forEach(function(userLevel, i) {
            var $element,
                $line = $('<div>')
                    .css({
                        height: '16px',
                        marginBottom: '4px'
                    })
                    .appendTo($capabilities);
            if (canEdit) {
                $element = Ox.Theme.formatColorLevel(i, userLevels.map(function(userLevel) {
                    return Ox.toTitleCase(userLevel);
                }), [0, 240]);
                Ox.Label({
                        textAlign: 'center',
                        title: Ox.toTitleCase(userLevel),
                        width: 60
                    })
                    .addClass('OxColor OxColorGradient')
                    .css({
                        float: 'left',
                        height: '12px',
                        paddingTop: '2px',
                        background: $element.css('background'),
                        fontSize: '8px',
                        color: $element.css('color')
                    })
                    .data({OxColor: $element.data('OxColor')})
                    .appendTo($line);
            }
            capabilities.forEach(function(capability) {
                var hasCapability = pandora.site.capabilities[capability.name][userLevel] >= rightsLevel,
                    $element = Ox.Theme.formatColorLevel(hasCapability, ['', '']);
                Ox.Button({
                        tooltip: (canEdit ? Ox.toTitleCase(userLevel) : 'You') + ' '
                            + (hasCapability ? 'can' : 'can\'t') + ' '
                            + Ox.toSlashes(capability.name)
                                .split('/').slice(1).join(' ')
                                .toLowerCase()
                                .replace('see item', 'see the item')
                                .replace('play video', 'play the full video')
                                .replace('download video', 'download the video'),
                        title: capability.symbol,
                        type: 'image'
                    })
                    .addClass('OxColor OxColorGradient')
                    .css({
                        background: $element.css('background'),
                        cursor: hasCapability ? 'pointer' : 'default'
                    })
                    .css('margin' + (canEdit ? 'Left' : 'Right'), '4px')
                    .data({OxColor: $element.data('OxColor')})
                    .bindEvent({
                        click: function() {
                            if (hasCapability) {
                                if (capability.name == 'canSeeItem') {
                                    $data.animate({scrollTop: 0}, 250);
                                } else if (capability.name == 'canPlayClips') {
                                    pandora.UI.set({itemView: 'clips'});
                                } else if (capability.name == 'canPlayVideo') {
                                    pandora.UI.set({itemView: ui.videoView});
                                } else if (capability.name == 'canDownloadVideo') {
                                    document.location.href = '/' + ui.item + '/torrent/';
                                }
                            }
                        }
                    })
                    .appendTo($line);
            });
            if (!canEdit) {
                Ox.Button({
                    title: 'Help',
                    tooltip: Ox._('About Rights'),
                    type: 'image'
                })
                .css({marginLeft: '52px'})
                .bindEvent({
                    click: function() {
                        pandora.UI.set({page: 'rights'});
                    }
                })
                .appendTo($line);
            }
        });
    }

    function renderList() {
        pandora.api.get({
            id: data.id,
            keys: [ui.icons == 'posters' ? 'posters' : 'frames']
        }, 0, function(result) {
            var images = result.data[ui.icons == 'posters' ? 'posters' : 'frames'].map(function(image) {
                    return Ox.extend(image, {index: image.index.toString()});
                }),
                selectedImage = images.filter(function(image) {
                    return image.selected;
                })[0];
            $list = Ox.IconList({
                    defaultRatio: ui.icons == 'posters' || !data.stream ? pandora.site.posters.ratio : data.stream.aspectratio,
                    fixedRatio: ui.icons == 'posters' || !data.stream ? false : data.stream.aspectratio,
                    item: function(data, sort, size) {
                        var ratio = data.width / data.height;
                        size = size || 128;
                        return {
                            height: ratio <= 1 ? size : size / ratio,
                            id: data['id'],
                            info: data.width + ' × ' + data.height + ' px',
                            title: ui.icons == 'posters' ? data.source : Ox.formatDuration(data.position),
                            url: data.url.replace('http://', '//'),
                            width: ratio >= 1 ? size : size * ratio
                        }
                    },
                    items: images,
                    keys: ui.icons == 'posters'
                        ? ['index', 'source', 'width', 'height', 'url']
                        : ['index', 'position', 'width', 'height', 'url'],
                    max: 1,
                    min: 1,
                    orientation: 'both',
                    // fixme: should never be undefined
                    selected: selectedImage ? [selectedImage['index']] : [],
                    size: 128,
                    sort: [{key: 'index', operator: '+'}],
                    unique: 'index'
                })
                .addClass('OxMedia')
                .css({
                    display: 'block',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: listWidth + 'px',
                    height: getHeight() + 'px'
                })
                .bindEvent({
                    select: function(event) {
                        var index = event.ids[0];
                        selectedImage = images.filter(function(image) {
                            return image.index == index;
                        })[0];
                        var imageRatio = selectedImage.width / selectedImage.height,
                            src = selectedImage.url.replace('http://', '//');
                        if ($browserImages.length == 0) {
                            $browserImages = pandora.$ui.browser.find('img[src*="/' + data.id + '/"]');
                        }
                        if (ui.icons == 'posters' && !ui.showSitePosters) {
                            $browserImages.each(function() {
                                var $this = $(this),
                                    size = Math.max($this.width(), $this.height());
                                $this.attr({src: src});
                                ui.icons == 'posters' && $this.css(imageRatio < 1 ? {
                                    width: Math.round(size * imageRatio) + 'px',
                                    height: size + 'px'
                                } : {
                                    width: size + 'px',
                                    height: Math.round(size / imageRatio) + 'px'
                                });
                            });
                            $icon.attr({src: src});
                            $reflectionIcon.attr({src: src});
                            iconRatio = imageRatio;
                            iconSize = iconSize == 256 ? 512 : 256;
                            toggleIconSize();
                        }
                        pandora.api[ui.icons == 'posters' ? 'setPoster' : 'setPosterFrame'](Ox.extend({
                            id: data.id
                        }, ui.icons == 'posters' ? {
                            source: selectedImage.source
                        } : {
                             // fixme: api slightly inconsistent, this shouldn't be "position"
                            position: selectedImage.index
                        }), function() {
                            var src;
                            Ox.Request.clearCache();
                            if (ui.icons == 'frames') {
                                src = '/' + data.id + '/icon512.jpg?' + Ox.uid();
                                $icon.attr({src: src});
                                $reflectionIcon.attr({src: src});
                                if (pandora.$ui.videoPreview) {
                                    pandora.$ui.videoPreview.options({
                                        position: $list.value(selectedImage.index, 'position')
                                    });
                                }
                            }
                            if (!ui.showSitePosters) {
                                $browserImages.each(function() {
                                    $(this).attr({src: '/' + data.id + '/' + (
                                        ui.icons == 'posters' ? 'poster' : 'icon'
                                    ) + '128.jpg?' + Ox.uid()});
                                });
                            }
                            if (ui.listSort[0].key == 'modified') {
                                pandora.$ui.browser.reloadList();
                            }
                        });
                    }
                })
                .appendTo($info);
            $list.size();
        });
    }

    function renderRightsLevel() {
        var $rightsLevelElement = getRightsLevelElement(data.rightslevel),
            $rightsLevelSelect;
        $rightsLevel.empty();
        if (canEdit) {
            $rightsLevelSelect = Ox.Select({
                    items: pandora.site.rightsLevels.map(function(rightsLevel, i) {
                        return {id: i, title: rightsLevel.name};
                    }),
                    width: 128,
                    value: data.rightslevel
                })
                .addClass('OxColor OxColorGradient')
                .css({
                    marginBottom: '4px',
                    background: $rightsLevelElement.css('background')
                })
                .data({OxColor: $rightsLevelElement.data('OxColor')})
                .bindEvent({
                    change: function(event) {
                        var rightsLevel = event.value;
                        $rightsLevelElement = getRightsLevelElement(rightsLevel);
                        $rightsLevelSelect
                            .css({background: $rightsLevelElement.css('background')})
                            .data({OxColor: $rightsLevelElement.data('OxColor')})
                        renderCapabilities(rightsLevel);
                        pandora.api.edit({id: data.id, rightslevel: rightsLevel}, function(result) {
                            // ...
                        });
                    }
                })
                .appendTo($rightsLevel);
        } else {
            $rightsLevelElement
                .css({
                    marginBottom: '4px',
                    cursor: 'pointer'
                })
                .bind({
                    click: function() {
                        pandora.UI.set({listSort: [{
                            key: 'rightslevel',
                            operator: pandora.getSortOperator('rightslevel')
                        }]});
                    }
                })
                .appendTo($rightsLevel);
        }
        $capabilities = $('<div>').appendTo($rightsLevel);
        renderCapabilities(data.rightslevel);
    }

    function toggleIconSize() {
        iconSize = iconSize == 256 ? 512 : 256;
        iconWidth = iconRatio > 1 ? iconSize : Math.round(iconSize * iconRatio);
        iconHeight = iconRatio < 1 ? iconSize : Math.round(iconSize / iconRatio);
        iconLeft = iconSize == 256 ? Math.floor((iconSize - iconWidth) / 2) : 0,
        borderRadius = ui.icons == 'posters' ? 0 : iconSize / 8;
        $icon.animate({
            left: margin + iconLeft + 'px',
            width: iconWidth + 'px',
            height: iconHeight + 'px',
            borderRadius: borderRadius + 'px'
        }, 250);
        $reflection.animate({
            top: margin + iconHeight + 'px',
            width: iconSize + 'px',
            height: iconSize / 2 + 'px'
        }, 250);
        $reflectionIcon.animate({
            left: iconLeft + 'px',
            width: iconWidth + 'px',
            height: iconHeight + 'px',
            borderRadius: borderRadius + 'px'
        }, 250);
        $reflectionGradient.animate({
            width: iconSize + 'px',
            height: iconSize / 2 + 'px'
        }, 250);
        $text.animate({
            left: margin + (iconSize == 256 ? 256 : iconWidth) + margin + 'px'
        }, 250);
        pandora.UI.set({infoIconSize: iconSize});
    }

    function updateMetadata() {
        var item = ui.item;
        $options.disableItem('update');
        // fixme: maybe there's a better method name for this?
        pandora.api.updateExternalData({
            id: ui.item
        }, function(result) {
            pandora.updateItemContext();
            Ox.Request.clearCache();
            if (ui.item == item && ui.itemView == 'info') {
                pandora.$ui.contentPanel.replaceElement(
                    1, pandora.$ui.item = pandora.ui.item()
                );
            }
            $options.enableItem('update');
        });
    }

    that.reload = function() {
        var src = src = '/' + data.id + '/' + (
            ui.icons == 'posters'
            ? (ui.showSitePosters ? 'siteposter' : 'poster') : 'icon'
        ) + '512.jpg?' + Ox.uid()
        $icon.attr({src: src});
        $reflectionIcon.attr({src: src});
        iconSize = iconSize == 256 ? 512 : 256;
        iconRatio = ui.icons == 'posters'
            ? (ui.showSitePosters ? pandora.site.posters.ratio : data.posterRatio) : 1;
        toggleIconSize();
        pandora.user.level == 'admin' && $list.replaceWith($list = renderList());
    };

    that.resize = function() {
        var height = getHeight() + 'px';
        $data.css({height: height});
        $list && $list.css({height: height});
    };

    that.bindEvent({
        pandora_icons: that.reload,
        pandora_showsiteposters: function() {
            ui.icons == 'posters' && that.reload();
        }
    });

    return that;

};
