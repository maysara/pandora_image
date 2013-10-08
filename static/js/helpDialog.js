// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.helpDialog = function() {

    var text = {},

        $panel, $list, $text, $image,

        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'switch',
                    title: Ox._('API Documentation...')
                }).bindEvent({
                    click: function() {
                        pandora.UI.set({page: 'api'});
                    }
                }),
                {},
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
            content: Ox.LoadingScreen(),
            height: 384,
            keys: {escape: 'close'},
            maximizeButton: true,
            minHeight: 256,
            minWidth: 544 + 2 * Ox.UI.SCROLLBAR_SIZE,
            removeOnClose: true,
            title: Ox._('Help'),
            width: 672 + 2 * Ox.UI.SCROLLBAR_SIZE
        })
        .bindEvent({
            close: function() {
                pandora.user.ui.page == 'help' && pandora.UI.set({page: ''});
            },
            resize: resize,
            'pandora_part.help': function(data) {
                if (pandora.user.ui.page == 'help') {
                    that.select(data.value == '' ? 'help' : data.value);
                }
            }
        });

    Ox.get('/static/html/help.html', function(html) {

        var $html = $('<div>'),
            strings = Ox.clone(pandora.site, true);

        strings.addAnnotationShortcuts = strings.layers.map(function(layer, index) {
            return '<tr><td>' + index + '</td><td>' + Ox._('Add {0}', [layer.item.toLowerCase()]) + '</td></tr>';
        }).join('\n');
        strings.itemName = Ox.map(strings.itemName, function(v) {
            return v.toLowerCase();
        });
        strings.signup = pandora.user.level == 'guest'
            ? '<a href="/signup">' + Ox._('sign up') + '</a>' : Ox._('sign up');

        $html.html(Ox.formatString(html, strings));

        pandora.site.help.forEach(function(section) {
            var html = $html.find('#' + section.id).html();
            text[section.id] = '<h1><b>' + Ox._(section.title) + '</b></h1>\n' + html;
        });

        $list = Ox.TableList({
                // fixme: silly
                _tree: true,
                columns: [
                    {
                        id: 'title',
                        visible: true,
                        width: 128 - Ox.UI.SCROLLBAR_SIZE
                    }
                ],
                items: pandora.site.help.map(function(value, index) {
                    return Ox.extend({index: index}, value, {title: Ox._(value.title)});
                }),
                max: 1,
                min: 1,
                scrollbarVisible: true,
                selected: [pandora.user.ui.part.help || 'help'],
                sort: [{key: 'index', operator: '+'}],
                unique: 'id'
            })
            .bindEvent({
                select: function(data) {
                    var id = data.ids[0] == 'help' ? '' : data.ids[0];
                    pandora.UI.set({'part.help': id});
                }
            });

        $text = Ox.Element()
            .addClass('OxTextPage OxSelectable')
            .css({
                padding: '16px',
                overflowY: 'scroll'
            });

        $panel = Ox.SplitPanel({
            elements: [
                {element: $list, size: 128 + Ox.UI.SCROLLBAR_SIZE},
                {element: $text}
            ],
            orientation: 'horizontal'
        });

        that.select(pandora.user.ui.part.help).options({content: $panel});
        $list.gainFocus();
        
    });

    function getImageSize() {
        var width = that.options('width') - 160 - 2 * Ox.UI.SCROLLBAR_SIZE,
            height = Math.round(width * 5/8);
        return {width: width, height: height};
    }

    function resize(data) {
        $list.size();
        $image && $image.options(getImageSize());
    }

    that.select = function(id) {
        var img, $img;
        $text.html(text[id || 'help']).scrollTop(0);
        img = $text.find('img');
        if (img) {
            $img = $(img);
            $img.replaceWith(
                $image = Ox.ImageElement(
                    Ox.extend(getImageSize(), {src: $img.attr('src')})
                )
                .css({borderRadius: '8px'})
            );
        }
        $text.find('td:first-child')
            .css({
                height: '16px',
                paddingRight: '8px',
                textAlign: 'right',
                whiteSpace: 'nowrap'
            });
        pandora.createLinks($text);
        return that;
    }

    return that;

};
