// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.siteDialog = function(section) {

    var canSeeVersion = pandora.site.capabilities.canSeeSoftwareVersion[pandora.user.level],
        dialogHeight = Math.round((window.innerHeight - 48) * 0.75),
        dialogWidth = Math.round(window.innerWidth * 0.75),
        isEditable = pandora.site.capabilities.canEditSitePages[pandora.user.level],
        tabs = Ox.clone(pandora.site.sitePages, true).concat([{id: 'software', title: Ox._('Software')}]);
    Ox.getObjectById(tabs, section).selected = true;
    var $tabPanel = Ox.TabPanel({
            content: function(id) {
                var $content = Ox.Element()
                    .css({padding: '16px', overflowY: 'auto'});
                if (id != 'contact') {
                    $content.addClass('OxTextPage');
                }
                if (id == 'contact') {
                    pandora.$ui.contactForm = pandora.ui.contactForm().appendTo($content);
                } else if (id == 'news') {
                    pandora.$ui.news = pandora.ui.news(dialogWidth, dialogHeight).appendTo($content);
                } else if (id == 'software') {
                    Ox.Element()
                        .html(
                            '<h1><b>pan.do/ra</b></h1>'
                            + '<sub>open media archive</sub>'
                            + '<p><b>' + pandora.site.site.name + '</b> is based on <b>pan.do/ra</b>, '
                            + 'a free, open source platform for media archives.</p>'
                            + '<b>pan.do/ra</b> includes <b>OxJS</b>, '
                            + 'a new JavaScript library for web applications.</p>'
                            + '<p>To learn more about <b>pan.do/ra</b> and <b>OxJS</b>, '
                            + 'please visit <a href="https://pan.do/ra">pan.do/ra</a> '
                            + 'and <a href="https://oxjs.org">oxjs.org</a>.</p>'
                            + (
                                canSeeVersion
                                ? '<sub><b>' + pandora.site.site.name
                                    + '</b> is running <b>pan.do/ra</b> revision '
                                    + pandora.site.site.version + '.</sub>'
                                : ''
                            )
                        )
                        .appendTo($content);
                } else {
                    pandora.api.getPage({name: id}, function(result) {
                        var $right, risk;
                        Ox.Editable({
                                clickLink: pandora.clickLink,
                                editable: isEditable,
                                tooltip: isEditable ? pandora.getEditTooltip() : '',
                                type: 'textarea',
                                placeholder: isEditable ? Ox._('Doubleclick to insert text') : '',
                                value: result.data.text
                            })
                            .css(id == 'rights' ? {
                                // this will get applied twice,
                                // total is 144px
                                marginRight: '72px'
                            } : {
                                width: '100%'
                            })
                            .bindEvent({
                                submit: function(data) {
                                    Ox.Request.clearCache('getPage');
                                    pandora.api.editPage({
                                        name: id,
                                        text: data.value
                                    });
                                }
                            })
                            .appendTo($content);
                        if (id == 'rights') {
                            $right = $('<div>')
                                .css({position: 'absolute', top: '16px', right: '16px', width: '128px', lineHeight: 'normal'})
                                .appendTo($content);
                            $('<img>')
                                .attr({src: '/static/png/rights.png'})
                                .css({width: '128px', height: '128px', marginBottom: '8px'})
                                .appendTo($right);
                            risk = ['Unknown', 'Severe', 'High', 'Significant', 'General', 'Low'];
                            [].concat(
                                ['Unknown'],
                                pandora.site.rightsLevels.map(function(rightsLevel) {
                                    return rightsLevel.name;
                                }).reverse()
                            ).forEach(function(name, i) {
                                Ox.Theme.formatColor(330 + 30 * i, 'gradient')
                                    .css({
                                        padding: '4px',
                                        marginTop: '8px'
                                    })
                                    .html(
                                        '<b>' + name + '</b><br/><div style="padding-top: 2px; font-size: 9px; opacity: 0.75">'
                                        + risk[i] + ' Risk'
                                        + (risk[i].length > 6 ? '<br/> of ' : ' of<br/>')
                                        + 'Legal Action</div>'
                                    )
                                    .appendTo($right);
                            });
                        }                        
                    });
                }
                return Ox.SplitPanel({
                    elements: [
                        {
                            element: Ox.Element()
                                .css({padding: '16px'})
                                .append(
                                    $('<img>')
                                        .attr({
                                            src: '/static/png/' + (
                                                id == 'software' ? 'software' : 'logo'
                                            ) + '.png'
                                        })
                                        .css({
                                            width: '256px',
                                            marginTop: id == 'software' ? '-16px' : 0
                                        })
                                ),
                            size: 272
                        },
                        {
                            element: $content
                        }
                    ],
                    orientation: 'horizontal'
                });
            },
            tabs: tabs
        })
        .bindEvent({
            change: function(data) {
                that.options({
                    title: Ox._(Ox.getObjectById(tabs, data.selected).title)
                });
                pandora.UI.set({page: data.selected});
            }
        });

    var that = Ox.Dialog({
            buttons: [
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
            content: $tabPanel,
            height: dialogHeight,
            maximizeButton: true,
            minHeight: 256,
            minWidth: 688, // 16 + 256 + 16 + 384 + 16
            removeOnClose: true,
            title: Ox._(Ox.getObjectById(tabs, section).title),
            width: dialogWidth
        })
        .bindEvent({
            close: function(data) {
                Ox.getObjectById(tabs, pandora.user.ui.page) && pandora.UI.set({page: ''});
            },
            resize: function(data) {
                var selected = $tabPanel.selected();
                if (selected == 'contact') {
                    pandora.$ui.contactForm.resize();
                } else if (selected == 'news') {
                    pandora.$ui.news.resize(data);
                }
            }
        });

    that.select = function(id) {
        $tabPanel.select(id);
        return that;
    };

    return that;

};
