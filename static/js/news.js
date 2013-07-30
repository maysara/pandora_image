'use strict';

pandora.ui.news = function(width, height) {

    var that = Ox.Element(),
        $left = $('<div>')
            .css({position: 'absolute', width: width - 512})
            .appendTo(that),
        $right = $('<div>')
            .css({position: 'absolute', top: '16px', right: '16px', width: '192px'})
            .appendTo(that),
        backgroundColor = Ox.Theme() == 'oxlight' ? 'rgb(224, 224, 224)'
            : Ox.Theme() == 'oxmedium' ? 'rgb(128, 128, 128)'
            : 'rgb(32, 32, 32)',        
        isEditable = pandora.site.capabilities.canEditSitePages[pandora.user.level],
        items = [],
        $text;

    pandora.api.getNews(function(result) {
        items = result.data.items;
        selectItem();
    });

    function addItem() {
        pandora.api.addNews({
            title: Ox._('Untitled'),
            date: Ox.formatDate(new Date(), '%Y-%m-%d'),
            text: ''
        }, function(result) {
            items.splice(0, 0, result.data);
            pandora.UI.set({'part.news': result.data.id});
        });
    }

    function editItem(key, value) {
        var data = {id: pandora.user.ui.part.news},
            index = Ox.getIndexById(items, pandora.user.ui.part.news);
        if (index == -1) {
            index = 0;
        }
        data[key] = value;
        pandora.api.editNews(data, function(result) {
            items[index] = result.data;
            ['title', 'date'].indexOf(key) > -1 && renderList();
        });
    }

    function removeItem() {
        var index = Ox.getIndexById(items, pandora.user.ui.part.news);
        if (index == -1) {
            index = 0;
        }
        items.splice(index, 1);
        pandora.api.removeNews({id: pandora.user.ui.part.news}, function(result) {
            pandora.UI.set({
                'part.news': items.length == 0 ? ''
                    : items[Math.min(index, items.length - 1)].id
            });
        });
    }

    function renderItem() {
        var $title, $date,
            index = Ox.getIndexById(items, pandora.user.ui.part.news);
        if (index == -1) {
            index = 0;
        }
        $left.empty();
        if (items.length) {
            $title = Ox.Editable({
                    editable: isEditable,
                    tooltip: isEditable ? pandora.getEditTooltip() : '',
                    value: items[index].title
                })
                .addClass('OxSelectable')
                .css({
                    display: 'inline-block',
                    fontWeight: 'bold',
                    fontSize: '16px',
                })
                .bindEvent({
                    submit: function(data) {
                        editItem('title', data.value);
                    }
                })
                .appendTo($left);
            $('<div>').css({height: '2px'}).appendTo($left);
            $date = Ox.Editable({
                    editable: isEditable,
                    format: function(value) {
                        return Ox.formatDate(value, '%B %e, %Y');
                    },
                    tooltip: isEditable ? pandora.getEditTooltip() : '',
                    value: items[index].date
                })
                .addClass('OxSelectable')
                .css({
                    display: 'inline-block',
                    fontSize: '9px'
                })
                .bindEvent({
                    submit: function(data) {
                        editItem('date', data.value);
                    }
                })
                .appendTo($left);
            $('<div>').css({height: '8px'}).appendTo($left);
            $text = Ox.Editable({
                    clickLink: pandora.clickLink,
                    editable: isEditable,
                    maxHeight: height - 96,
                    placeholder: Ox._('No text'),
                    tooltip: isEditable ? pandora.getEditTooltip() : '',
                    type: 'textarea',
                    value: items[index].text,
                    width: width - 512
                })
                .addClass('OxSelectable')
                .bindEvent({
                    submit: function(data) {
                        editItem('text', data.value);
                    }
                })
                .appendTo($left);
        }
    }

    function renderList() {
        $right.empty();
        if (isEditable) {
            $('<div>')
                .css({height: '16px', marginBottom: '8px'})
                .append(
                    Ox.Button({
                            title: Ox._('Add'),
                            width: 92
                        })
                        .css({float: 'left', margin: '0 4px 0 0'})
                        .bindEvent({
                            click: addItem
                        })
                )
                .append(
                    Ox.Button({
                            title: Ox._('Remove'),
                            width: 92
                        })
                        .css({float: 'left', margin: '0 0 0 4px'})
                        .bindEvent({
                            click: removeItem
                        })
                )
                .appendTo($right);
        }
        items.sort(function(a, b) {
            return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
        }).forEach(function(item, i) {
            Ox.Element()
                .addClass('item')
                .css({
                    width: '172px',
                    padding: '4px 8px 5px 8px',
                    borderRadius: '8px',
                    margin: '2px',
                    backgroundColor: (item.id == pandora.user.ui.part.news)
                        || (!pandora.user.ui.part.news && i == 0)
                        ? backgroundColor : '',
                    cursor: 'pointer'
                })
                .html(
                    '<span style="font-size: 14px; font-weight: bold">' + item.title + '</span>'
                    + '<br><span style="font-size: 9px">'
                    + Ox.formatDate(item.date, '%B %e, %Y')
                    + '</span>'
                )
                .bindEvent({
                    anyclick: function() {
                        pandora.UI.set('part.news', item.id);
                    }
                })
                .appendTo($right);
        });
    }

    function selectItem() {
        renderItem();
        renderList();
    }

    that.resize = function(data) {
        width = data.width;
        height = data.height;
        $left.css({width: width - 512});
        $text && $text.css({width: width - 512});
    };

    that.bindEvent({
        'pandora_part.news': selectItem
    });

    return that;

};
