// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.statisticsDialog = function() {

    var colors = {
            system: {
                'Android': [0, 255, 0],
                'BlackBerry': [64, 64, 64],
                'BSD': [255, 0, 0],
                'iOS': [0, 128, 255],
                'Java': [128, 128, 128],
                'Linux': [255, 128, 0],
                'Mac OS X': [0, 255, 255],
                'Nokia': [255, 0, 255],
                'PlayStation': [192, 192, 192],
                'RIM Tablet OS': [64, 64, 64],
                'Unix': [255, 255, 0],
                'Wii': [192, 192, 192],
                'Windows': [0, 0, 255],
                'Windows Phone': [0, 0, 128]
            },
            browser: {
                'Camino': [192, 192, 192],
                'Chrome Frame': [255, 255, 0], // has to be before 'Chrome'
                'Chrome': [0, 255, 0],
                'Chromium': [128, 255, 0],
                'Epiphany': [128, 128, 128],
                'Firefox': [255, 128, 0],
                'Internet Explorer': [0, 0, 255],
                'Konqueror': [64, 64, 64],
                'Nokia Browser': [255, 0, 255],
                'Opera': [255, 0, 0],
                'Safari': [0, 255, 255],
                'WebKit': [0, 255, 128]
            }
        },
        dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),
        tabs = [
            {id: 'seen', title: Ox._('First Seen & Last Seen'), selected: true},
            {id: 'locations', title: Ox._('Locations')},
            {id: 'platforms', title: Ox._('Platforms & Browsers')}
        ],

        $dialog = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'manageUsers',
                    title: Ox._('Manage Users...')
                }).bindEvent({
                    click: function() {
                        $dialog.close();
                        pandora.$ui.usersDialog = pandora.ui.usersDialog().open();
                    }
                }),
                {},
                Ox.Button({
                    id: 'close',
                    title: Ox._('Close')
                }).bindEvent({
                    click: function() {
                        $dialog.close();
                    }
                })
            ],
            closeButton: true,
            content: Ox.LoadingScreen(),
            height: dialogHeight,
            maximizeButton: true,
            minHeight: 256,
            minWidth: 512,
            removeOnClose: true,
            title: Ox._('Statistics'),
            width: dialogWidth
        })
        .bindEvent({
            resizeend: function(data) {
                dialogWidth = data.width;
                $tabPanel.$element.replaceElement(1,
                    $tabPanel.options('content')($tabPanel.selected())
                );
            }
        }),

        $tabPanel;

    pandora.api.findUsers({
        keys: ['browser', 'firstseen', 'lastseen', 'level', 'location', 'system'],
        query: {
            conditions: [{key: 'level', value: 'robot', operator: '!='}],
            operator: '&'
        },
        range: [0, 1000000],
        sort: [{key: 'username', operator: '+'}]
    }, function(result) {    

        var data = {},
            flagCountry = {},
            $guestsCheckbox;

        ['all', 'registered'].forEach(function(mode) {

            data[mode] = {
                year: {},
                month: {},
                day: {},
                weekday: {},
                hour: {},
                continent: {},
                region: {},
                country: {},
                city: {},
                system: {},
                browser: {},
                systemandbrowser: {},
                systemversion: {},
                browserversion: {},
                systemandbrowserversion: {}
            };

            result.data.items.forEach(function(item) {
                var city, continent, country, countryData, name = {}, region, split;
                if (mode == 'all' || item.level != 'guest') {
                    ['firstseen', 'lastseen'].forEach(function(key, i) {
                        var year = Ox.formatDate(item[key], '%Y') + '-' + key,
                            month = Ox.formatDate(item[key], '%Y-%m') + '-' + key,
                            day = Ox.formatDate(item[key], '%Y-%m-%d'),
                            weekday = Ox.formatDate(item[key], '%u'),
                            hour = Ox.formatDate(item[key], '%H');
                        data[mode].year[year] = data[mode].year[year] || {};
                        data[mode].year[year][month] = (data[mode].year[year][month] || 0) + 1;                
                        data[mode].month[month] = (data[mode].month[month] || 0) + 1;
                        if (key == 'firstseen') {
                            data[mode].day[day] = data[mode].day[day] || {};
                            data[mode].day[day][hour] = (data[mode].day[day][hour] || 0) + 1;
                            data[mode].weekday[weekday] = data[mode].weekday[weekday] || {};
                            data[mode].weekday[weekday][hour] = (data[mode].weekday[weekday][hour] || 0) + 1;           
                            data[mode].hour[hour] = (data[mode].hour[hour] || 0) + 1;
                        }
                    });
                    if (item.location) {
                        split = item.location.split(', ')
                        if (split.length == 1) {
                            country = split[0];
                        } else {
                            city = split[0];
                            country = split[1];
                        }
                        countryData = Ox.getCountryByName(country) || {continent: '', region: ''};
                        continent = countryData.continent;
                        region = [continent, countryData.region].join(', ');
                        country = [region, country].join(', ')
                        city = city ? [country, city].join(', ') : '';
                        data[mode].continent[continent] = (data[mode].continent[continent] || 0) + 1;
                        data[mode].region[region] = (data[mode].region[region] || 0) + 1;
                        data[mode].country[country] = (data[mode].country[country] || 0) + 1;
                        if (city) {
                            data[mode].city[city] = (data[mode].city[city] || 0) + 1;
                        }
                    }
                    ['system', 'browser'].forEach(function(key) {
                        var version = item[key];
                        if (version) {
                            name[key] = getName(key, version);
                            if (name[key]) {
                                data[mode][key][name[key]] = (data[mode][key][name[key]] || 0) + 1; 
                                key = key + 'version';
                                data[mode][key][version] = (data[mode][key][version] || 0) + 1;
                            }
                        }
                    });
                    if (name.system && name.browser) {
                        name = name.system + ' / ' + name.browser;
                        data[mode].systemandbrowser[name] = (data[mode].systemandbrowser[name] || 0) + 1;
                        name = item.system + ' / ' + item.browser;
                        data[mode].systemandbrowserversion[name] = (data[mode].systemandbrowserversion[name] || 0) + 1;
                    }
                }
            });

            var keys, firstKey, lastKey;
            keys = Object.keys(data[mode].month).map(function(key) {
                return key.slice(0, 7);
            }).sort();
            firstKey = keys[0].split('-').map(function(str) {
                return parseInt(str, 10);
            });
            lastKey = Ox.formatDate(new Date(), '%F').split('-').map(function(str) {
                return parseInt(str, 10);
            });
            Ox.loop(firstKey[0], lastKey[0] + 1, function(year) {
                ['firstseen', 'lastseen'].forEach(function(key) {
                    var key = [year, key].join('-');
                    data[mode].year[key] = data[mode].year[key] || {};
                });
                Ox.loop(
                    year == firstKey[0] ? firstKey[1] : 1,
                    year == lastKey[0] ? lastKey[1] + 1 : 13,
                    function(month) {
                        ['firstseen', 'lastseen'].forEach(function(key) {
                            var key = [year, Ox.pad(month, 2), key].join('-');
                            data[mode].month[key] = data[mode].month[key] || 0;
                        });
                    }
                );
            });

            keys = Object.keys(data[mode].day).sort();
            firstKey = keys[0].split('-').map(function(str) {
                return parseInt(str, 10);
            });
            Ox.loop(firstKey[0], lastKey[0] + 1, function(year) {
                Ox.loop(
                    year == firstKey[0] ? firstKey[1] : 1,
                    year == lastKey[0] ? lastKey[1] + 1 : 13,
                    function(month) {
                        Ox.loop(
                            year == firstKey[0] && month == firstKey[1] ? firstKey[2] : 1,
                            year == lastKey[0] && month == lastKey[1] ? lastKey[2] + 1
                                : Ox.getDaysInMonth(year, month) + 1,
                            function(day) {
                                var key = [year, Ox.pad(month, 2), Ox.pad(day, 2)].join('-');
                                data[mode].day[key] = data[mode].day[key] || {};
                            }
                        );
                    }
                );
            });

            flagCountry[mode] = {};
            ['continent', 'region'].forEach(function(key) {
                flagCountry[mode][key] = {};
                Ox.forEach(data[mode][key], function(regionValue, regionKey) {
                    regionKey = regionKey.split(', ').pop();
                    var max = 0;
                    Ox.forEach(data[mode].country, function(countryValue, countryKey) {
                        countryKey = countryKey.split(', ').pop();
                        if (
                            (Ox.getCountryByName(countryKey) || {})[key] == regionKey
                            && countryValue > max
                        ) {
                            flagCountry[mode][key][regionKey] = countryKey;
                            max = countryValue;
                        }
                    });
                });
            });

        });

        $guestsCheckbox = Ox.Checkbox({
                title: Ox._('Include Guests'),
                value: false
            })
            .css({float: 'left', margin: '4px'})
            .bindEvent({
                change: function() {
                    $tabPanel.$element.replaceElement(1,
                        $tabPanel.options('content')($tabPanel.selected())
                    );
                }
            });

        $tabPanel = Ox.TabPanel({
            content: function(id) {
                var chartWidth = dialogWidth - 32 - Ox.UI.SCROLLBAR_SIZE,
                    mode = $guestsCheckbox.options('value') ? 'all' : 'registered',
                    top = 16,
                    $content = Ox.Element()
                        .css({
                            padding: '16px',
                            overflowY: 'auto',
                            background: pandora.user.ui.theme == 'oxlight' ? 'rgb(240, 240, 240)'
                                : pandora.user.ui.theme == 'oxmedium' ? 'rgb(160, 160, 160)'
                                : 'rgb(16, 16, 16)' 
                        });
                if (id == 'seen') {
                    ['year', 'month', 'lastdays', 'topdays', 'weekday', 'hour'].forEach(function(key) {
                        var isDate = ['year', 'month'].indexOf(key) > -1,
                            isDay = ['lastdays', 'topdays'].indexOf(key) > -1;
                        Ox.Chart({
                                color: function(value) {
                                        var split = value.split('-'),
                                            color = isDate ? Ox.rgb(
                                                    Ox.mod(8 - parseInt(split[1], 10), 12) * 30, 1, 0.5
                                                ) : Ox.rgb(
                                                    (Math.abs(11.5 - parseInt(split[0], 10)) - 0.5) * -11, 1, 0.5
                                                );
                                        if (pandora.user.ui.theme == 'oxlight') {
                                            color = getColor(color);
                                        }
                                        return color;
                                    },
                                data: data[mode][isDay ? 'day' : key],
                                formatKey: function(value) {
                                    var ret, split;
                                    if (isDate) {
                                        split = value.split('-');
                                        ret = (split.pop() == 'firstseen' ? 'First' : 'Last') + ': '
                                            + (key == 'year' ? '' : Ox.MONTHS[parseInt(split[1], 10) - 1])
                                            + ' ' + split[0];
                                    } else if (isDay) {
                                        split = value.split('-');
                                        ret = Ox.SHORT_WEEKDAYS[parseInt(Ox.formatDate(value, '%u')) - 1] + ', '
                                            + Ox.SHORT_MONTHS[parseInt(split[1], 10) - 1] + ' '
                                            + parseInt(split[2], 10) + ', ' + split[0];
                                    } else {
                                        ret = key == 'weekday'
                                            ? Ox.WEEKDAYS[parseInt(value, 10) - 1]
                                            : value + ':00';
                                    }
                                    return ret;
                                },
                                keyAlign: 'right',
                                keyWidth: 128,
                                limit: isDay ? 30 : 0,
                                rows: isDate ? 2 : 1,
                                sort: {
                                    key: key == 'topdays' ? 'value' : 'key',
                                    operator: isDate || isDay ? '-' : '+'
                                },
                                title: key == 'lastdays' ? Ox._('Last 30 Days')
                                    : key == 'topdays' ? Ox._('Top 30 Days')
                                    : Ox._(Ox.toTitleCase(key) + 's'),
                                width: chartWidth
                            })
                            .css({
                                position: 'absolute',
                                left: '16px',
                                top: top + 'px'
                            })
                            .appendTo($content);
                        top += (isDay ? Math.min(Ox.len(data[mode].day), 30) : Ox.len(data[mode][key])) * 16 + 32;
                    });
                } else if (id == 'locations') {
                    ['continent', 'region', 'country', 'city'].forEach(function(key) {
                        Ox.Chart({
                                color: function(value) {
                                    var color = Ox.getGeoColor(
                                        key == 'continent' ? value : value.split(', ')[1]
                                    );
                                    if (pandora.user.ui.theme == 'oxlight') {
                                        color = getColor(color);
                                    }
                                    return color;
                                },
                                data: data[mode][key],
                                formatKey: function(value) {
                                    var city, country, split = value.split(', ');
                                    if (key == 'continent' || key == 'region') {
                                        country = flagCountry[mode][key][Ox.last(split)];
                                    } else {
                                        country = split[2];
                                        city = key == 'city' ? split[3] : ''
                                    }
                                    return $('<div>')
                                        .append(
                                            $('<div>')
                                                .css({
                                                    float: 'left',
                                                    width: '104px',
                                                    height: '14px',
                                                    marginLeft: '-4px',
                                                    marginRight: '4px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                })
                                                .html(
                                                    Ox.last(split)
                                                )
                                        )
                                        .append(
                                            Ox.Element({
                                                    element: '<img>',
                                                    tooltip: mode == 'all' && (key == 'continent' || key == 'region')
                                                        ? Ox.wordwrap(
                                                            Ox.COUNTRIES.filter(function(country) {
                                                                return country[key] == split[key == 'continent' ? 0 : 1]
                                                                    && country.code.length == 2
                                                                    && !country.exception
                                                                    && !country.disputed
                                                                    && !country.dissolved;
                                                            }).map(function(country) {
                                                                return country.name;
                                                            }).sort().join(', '),
                                                            64, '<br>', true
                                                        ).split(', ').map(function(country) {
                                                            return Ox.values(Ox.map(data.all.country, function(value, key) {
                                                                    return key.split(', ').pop()
                                                                })).indexOf(country.replace(/<br>/g, '')) > -1
                                                                ? '<span class="OxBright">' + country + '</span>'
                                                                : country
                                                        }).join(', ')
                                                        : ''
                                                })
                                                .attr({
                                                    src: Ox.getFlagByGeoname(country, 16)
                                                })
                                                .css({
                                                    float: 'left',
                                                    width: '14px',
                                                    height: '14px',
                                                    borderRadius: '4px',
                                                    margin: '0 1px 0 1px'
                                                })
                                        );
                                },
                                keyAlign: 'right',
                                keyWidth: 128,
                                limit: 1000,
                                sort: {key: 'value', operator: '-'},
                                title: (
                                    Ox.endsWith(key, 'y')
                                    ? Ox.toTitleCase(key).slice(0, -1) + 'ies'
                                    : Ox.toTitleCase(key) + 's'
                                ) + ' (' + (
                                    Ox.len(data[mode][key]) > 1000
                                    ? '1,000 of '
                                    : ''
                                ) + Ox.formatNumber(Ox.len(data[mode][key])) + ')',
                                width: chartWidth
                            })
                            .css({
                                position: 'absolute',
                                left: '16px',
                                top: top + 'px'
                            })
                            .appendTo($content);
                        top += Math.min(Ox.len(data[mode][key]), 1000) * 16 + 32;
                    });
                } else if (id == 'platforms') {
                    ['', 'version'].forEach(function(version, i) {
                        ['system', 'browser'].forEach(function(key) {
                            Ox.Chart({
                                    color: function(value) {
                                        var name = version ? getName(key, value) : value,
                                            color = colors[key][name];
                                        if (pandora.user.ui.theme == 'oxlight') {
                                            color = getColor(color);
                                        }
                                        return color;
                                    },
                                    data: data[mode][key + version],
                                    formatKey: function(value) {
                                        var name = version ? getName(key, value) : value,
                                            $element = $('<div>');
                                        $element.append(
                                            $('<div>')
                                                .css({
                                                    float: 'left',
                                                    width: '168px',
                                                    height: '14px',
                                                    marginLeft: '-4px',
                                                    marginRight: '4px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                })
                                                .html(
                                                    value
                                                        .replace(/BSD \((.+)\)/, '$1')
                                                        .replace(/Linux \((.+)\)/, '$1')
                                                        .replace(/Unix \((.+)\)/, '$1')
                                                        .replace(/Windows (NT \d+\.\d+) \((.+)\)/, 'Windows $2 ($1)')
                                                )
                                        ).append(
                                            $('<img>')
                                                .attr({
                                                    src: Ox.UI.PATH + 'png/' + key
                                                        + name.replace(/ /g, '') + '128.png'
                                                })
                                                .css({
                                                    float: 'left',
                                                    width: '14px',
                                                    height: '14px',
                                                    margin: '0 1px 0 1px'
                                                })
                                        );
                                        return $element;
                                    },
                                    keyWidth: 192,
                                    sort: version == ''
                                        ? {key: 'value', operator: '-'}
                                        : {key: 'key', operator: '+'},
                                    title: Ox._(key == 'system'
                                        ? (version == '' ? 'Platforms' : 'Platform Versions')
                                        : (version == '' ? 'Browsers' : 'Browser Versions')),
                                    width: chartWidth
                                })
                                .css({
                                    position: 'absolute',
                                    left: '16px',
                                    top: top + 'px'
                                })
                                .appendTo($content);
                            top += Ox.len(data[mode][key + version]) * 16 + 32;
                        });
                        Ox.Chart({
                            color: function(value) {
                                var color = Ox.zip(value.split(' / ').map(function(v, i) {
                                        var key = ['system', 'browser'][i];
                                        v = version ? getName(key, v) : v;
                                        return colors[key][v];
                                    })).map(function(c) {
                                        return Math.round(Ox.sum(c) / 2);
                                    });
                                if (pandora.user.ui.theme == 'oxlight') {
                                    color = getColor(color);
                                }
                                return color;
                            },
                            data: data[mode]['systemandbrowser' + version],
                            formatKey: function(value) {
                                var $element = $('<div>')
                                    .append(
                                        $('<div>')
                                            .css({
                                                float: 'left',
                                                width: '152px',
                                                height: '14px',
                                                marginLeft: '-4px',
                                                marginRight: '4px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            })
                                            .html(
                                                version
                                                ? value
                                                    .replace(/BSD \((.+)\)/, '$1')
                                                    .replace(/Linux \((.+)\)/, '$1')
                                                    .replace(/(Mac OS X \d+\.\d+) \(.+\)/, '$1')
                                                    .replace(/Unix \((.+)\)/, '$1')
                                                    .replace(/Windows NT \d+\.\d+ \((.+)\)/, 'Windows $1')
                                                    .replace(/Chrome Frame/, 'CF')
                                                    .replace(/Internet Explorer/, 'IE')
                                                : value
                                            )
                                    );
                                value.split(' / ').forEach(function(value, i) {
                                    var key = ['system', 'browser'][i];
                                    value = version ? getName(key, value) : value;
                                    $element.append(
                                        $('<img>')
                                            .attr({
                                                src: Ox.UI.PATH + 'png/' + key
                                                    + value.replace(/ /g, '') + '128.png'
                                            })
                                            .css({
                                                width: '14px',
                                                height: '14px',
                                                margin: '0 1px 0 1px'
                                            })
                                    );
                                });
                                return $element;
                            },
                            keyWidth: 192,
                            sort: version == ''
                                ? {key: 'value', operator: '-'}
                                : {key: 'key', operator: '+'},
                            title: version == ''
                                ? Ox._('Platforms & Browsers')
                                : Ox._('Platform & Browser Versions'),
                            width: chartWidth
                        })
                        .css({
                            position: 'absolute',
                            left: '16px',
                            top: top + 'px'
                        })
                        .appendTo($content);
                        top += Ox.len(data[mode]['systemandbrowser' + version]) * 16 + 32;
                    });
                }
                $('<div>')
                    .css({
                        position: 'absolute',
                        top: top - 16 + 'px',
                        width: '1px',
                        height: '16px'
                    })
                    .appendTo($content);
                return $content;
            },
            tabs: tabs
        });

        $tabPanel.find('.OxButtonGroup').css({width: '512px'});
        $guestsCheckbox.appendTo($tabPanel.children('.OxBar'));

        $dialog.options({content: $tabPanel});

    });

    function getColor(color) {
        var hsl = Ox.hsl(color);
        hsl[2] = Math.max(hsl[2] - 0.1, 0);
        return Ox.rgb(hsl);
    }

    function getName(key, version) {
        var name = '';
        Ox.forEach(Object.keys(colors[key]), function(v) {
            if (new RegExp('^' + v).test(version)) {
                name = v;
                return false;
            }
        });
        return name;        
    }

    return $dialog;

};
