// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.item = function() {

    var isVideoView = [
            'timeline', 'player', 'editor'
        ].indexOf(pandora.user.ui.itemView) > -1,
        item = pandora.user.ui.item,
        that = Ox.Element(),
        videopointsEvent = 'pandora_videopoints.' + item.toLowerCase();

    pandora.api.get({
        id: pandora.user.ui.item,
        keys: isVideoView ? [
            'cuts', 'director', 'duration', 'durations', 'editable', 'layers',
            'modified', 'parts', 'posterFrame', 'rendered', 'rightslevel',
            'size', 'title', 'videoRatio', 'year'
        ] : pandora.user.ui.itemView == 'documents' ? [
            'director', 'documents', 'duration', 'durations', 'editable',
            'rightslevel', 'size', 'title', 'videoRatio', 'year'
        ] : []
    }, pandora.user.ui.itemView == 'info' && pandora.site.capabilities.canEditMetadata[pandora.user.level] ? 0 : -1, function(result) {

        if (pandora.user.ui.item != item) {
            return;
        }

        if (result.status.code == 200) {
            // we want to cache the title in any way, so that after closing
            // a dialog and getting to this item, the title is correct
            var documentTitle = pandora.getDocumentTitle(Ox.decodeHTMLEntities(result.data.title));
            document.title = pandora.getPageTitle(document.location.pathname) || documentTitle;
        }

        pandora.$ui.itemTitle
            .options({
                title: '<b>' + result.data.title
                    + (Ox.len(result.data.director)
                        ? ' (' + result.data.director.join(', ') + ')'
                        : '')
                    + (result.data.year ? ' ' + result.data.year : '') + '</b>'
            })
            .show();

        // fixme: layers have value, subtitles has text?
        isVideoView && Ox.extend(result.data, pandora.getVideoOptions(result.data));

        if (!result.data.rendered && [
            'clips', 'timeline', 'player', 'editor', 'map', 'calendar'
        ].indexOf(pandora.user.ui.itemView) > -1) {
            pandora.$ui.contentPanel.replaceElement(1,
                Ox.Element()
                    .css({marginTop: '32px', fontSize: '12px', textAlign: 'center'})
                    .html(
                        Ox._('Sorry, <i>{0}</i>'
                        + ' currently doesn\'t have '
                        + (['a', 'e', 'i', 'o'].indexOf(
                            pandora.user.ui.itemView.slice(0, 1)
                        ) > -1 ? 'an': 'a') + ' '
                        +'{1} view.', [result.data.title, Ox._(pandora.user.ui.itemView)])
                    )
            );

        } else if (pandora.user.ui.itemView == 'info') {
            
            pandora.$ui.contentPanel.replaceElement(1,
                pandora.$ui.item = pandora.ui.infoView(result.data)
                    .bindEvent({
                        resize: function() {
                            pandora.$ui.item.resize && pandora.$ui.item.resize();
                        }
                    })
            );
        
        } else if (pandora.user.ui.itemView == 'documents') {

            pandora.$ui.contentPanel.replaceElement(1,
                pandora.$ui.documents = pandora.ui.documentsView(result.data)
            );

        } else if (pandora.user.ui.itemView == 'player') {

            pandora.$ui.contentPanel.replaceElement(1,
                pandora.$ui.player = pandora.ui.player(result.data)
            );

        } else if (pandora.user.ui.itemView == 'editor') {

            pandora.$ui.contentPanel.replaceElement(1,
                pandora.$ui.editor = pandora.ui.editor(result.data)
            );

        } else if (pandora.user.ui.itemView == 'timeline') {

            pandora.$ui.contentPanel.replaceElement(1,
                pandora.$ui.timeline = pandora.ui.timeline(result.data)
            );

        } else if (pandora.user.ui.itemView == 'clips') {

            pandora.$ui.contentPanel.replaceElement(1,
                pandora.ui.clipsView(result.data.videoRatio)
            );

        } else if (pandora.user.ui.itemView == 'map') {

            pandora.$ui.contentPanel.replaceElement(1,
                pandora.ui.navigationView('map', result.data.videoRatio)
            );

        } else if (pandora.user.ui.itemView == 'calendar') {

            pandora.$ui.contentPanel.replaceElement(1,
                pandora.ui.navigationView('calendar', result.data.videoRatio)
            );

        } else if (pandora.user.ui.itemView == 'data') {

            pandora.$ui.item = Ox.TreeList({
                data: result.data,
                width: pandora.$ui.mainPanel.size(1) - Ox.UI.SCROLLBAR_SIZE
            });
            pandora.$ui.contentPanel.replaceElement(1,
                Ox.Container().append(pandora.$ui.item)
            );

        } else if (pandora.user.ui.itemView == 'media') {

            pandora.$ui.contentPanel.replaceElement(1,
                pandora.$ui.item = pandora.ui.mediaView({
                    id: result.data.id
                })
            );

        } else if (pandora.user.ui.itemView == 'frames' || pandora.user.ui.itemView == 'posters') {

            pandora.$ui.contentPanel.replaceElement(1,
                pandora.$ui.item = pandora.ui.PostersView().bindEvent({
                    resize: function() {
                        pandora.$ui.item.resize();
                    }
                })
            );

        }

        if (isVideoView && result.data.rendered) {
            // handle links in annotations
            pandora.$ui[pandora.user.ui.itemView].bindEvent(
                videopointsEvent,
                function(data, event, element) {
                    var options = {};
                    if (event == videopointsEvent) {
                        //Ox.print('DATA.VALUE', JSON.stringify(data.value));
                        if (data && data.value && data.value.annotation) {
                            options.selected = pandora.user.ui.item + '/' + data.value.annotation;
                        } else {
                            // if annotation got set to something other than '',
                            // points and position will be set in consequence,
                            // so lets try to keep events from looping
                            ['annotation', 'in', 'out', 'position'].forEach(function(key) {
                                if (!Ox.isUndefined(data.value[key])) {
                                    options[key == 'annotation' ? 'selected' : key] = data.value[key];
                                }
                            });
                        }
                        pandora.$ui[pandora.user.ui.itemView].options(options);
                    }
                }
            );
        }

    });

    return that;

};

