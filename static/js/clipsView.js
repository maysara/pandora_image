// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.clipsView = function(videoRatio) {

    var $status = $('<div>')
            .css({
                width: '100%',
                marginTop: '2px',
                fontSize: '9px',
                textAlign: 'center'
            })
            .html(Ox._('Loading...')),

        that = Ox.SplitPanel({
            elements: [
                {
                    element: Ox.Bar({size: 24})
                        .bindEvent({
                            doubleclick: function(e) {
                                if ($(e.target).is('.OxBar')) {
                                    pandora.$ui.clipList.animate({scrollTop: 0}, 250);
                                }
                            }
                        })
                        .append(
                            pandora.$ui.sortElement = pandora.ui.sortElement()
                        )
                        .append(
                            Ox.Input({
                                    clear: true,
                                    placeholder: Ox._('Find Clips'),
                                    value: pandora.user.ui.itemFind,
                                    width: 192
                                })
                                .css({float: 'right', margin: '4px'})
                                .bindEvent({
                                    submit: function(data) {
                                        $status.html(Ox._('Loading...'));
                                        pandora.UI.set({itemFind: data.value});
                                        // since this is the only way itemFind can change,
                                        // there's no need for an event handler
                                        that.replaceElement(1,
                                            pandora.$ui.clipList = getClipList()
                                        );
                                    }
                                })
                        ),
                    size: 24
                },
                {
                    element: pandora.$ui.clipList = getClipList()
                },
                {
                    element: Ox.Bar({size: 16}).append($status),
                    size: 16
                }
            ],
            orientation: 'vertical'
        });

    function getClipList() {
        return pandora.ui.clipList(videoRatio)
            .bindEvent({
                init: function(data) {
                    var items = data.items;
                    $status.html(
                        Ox.toTitleCase(Ox.formatCount(items, 'clip'))
                    );
                }
            });
    }

    return that;
  
};
