// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.annotationDialog = function(layer) {
    var isEditor = pandora.user.ui.itemView == 'editor',
        that = pandora.ui.iconDialog({
            buttons: [].concat(
                isEditor ? [
                    Ox.Button({title: Ox._('Sign Up...')}).bindEvent({
                        click: function() {
                            that.close();
                            pandora.$ui.accountDialog = pandora.ui.accountDialog('signup').open();
                        }
                    }),
                    Ox.Button({title: Ox._('Sign In...')}).bindEvent({
                        click: function() {
                            that.close();
                            pandora.$ui.accountDialog = pandora.ui.accountDialog('signin').open();
                        }
                    })
                ] : [
                    Ox.Button({title: Ox._('Switch to Editor')}).bindEvent({
                        click: function() {
                            that.close();
                            pandora.UI.set({itemView: 'editor'});
                        }
                    })
                ],
                [
                    {},
                    Ox.Button({title: Ox._('Not Now')}).bindEvent({
                        click: function() {
                            that.close();
                        }
                    })
                ]
            ),
            text: Ox._('To add or edit {0}, ' + (
                isEditor
                ? 'please sign up or sign in.'
                : 'just switch to the editor.'
            ), [layer.toLowerCase()]),
            title: Ox.toTitleCase(layer)
        });
    return that;
};
