// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.contactForm = function() {

    var that = Ox.Element(),

        width = getWidth(),

        $form = Ox.Form({
            items: [
                Ox.Input({
                    id: 'name',
                    label: Ox._('Your Name'),
                    labelWidth: 128,
                    validate: function(value, callback) {
                        callback({valid: true});
                    },
                    value: pandora.user.username,
                    width: width
                }),
                Ox.Input({
                    autovalidate: pandora.autovalidateEmail,
                    id: 'email',
                    label: Ox._('Your E-Mail Address'),
                    labelWidth: 128,
                    validate: function(value, callback) {
                        callback({
                            message: Ox._('Please enter '
                                + (value.length == 0 ? 'your' : 'a valid')
                                + ' e-mail address'),
                            valid: Ox.isValidEmail(value)
                        });
                    },
                    value: pandora.user.email,
                    width: width
                }),
                Ox.Input({
                    id: 'subject',
                    label: Ox._('Subject'),
                    labelWidth: 128,
                    validate: function(value, callback) {
                        callback({valid: true});
                    },
                    value: '',
                    width: width
                }),
                Ox.Input({
                    autovalidate: /.+/,
                    height: 256,
                    id: 'message',
                    placeholder: 'Message',
                    type: 'textarea',
                    validate: function(value, callback) {
                        callback({
                            message: Ox._('Please enter a message'),
                            valid: value.length > 0
                        });
                    },
                    value: '',
                    width: width
                })
            ]
        })
        .css({width: width + 'px'})
        .bindEvent({
            validate: function(data) {
                $sendButton.options({disabled: !data.valid});
            }
        })
        .appendTo(that),

    $receiptCheckbox = Ox.Checkbox({
            id: 'receipt',
            title: Ox._('Send a receipt to {0}', [pandora.user.email]),
            value: pandora.user.level != 'guest',
            width: width - 136
        })
        .css({float: 'left', margin: '8px 4px 8px 0'})
        .bindEvent({
            change: function(data) {
                $receiptCheckbox.options({
                    title: data.value
                        ? Ox._('Send a receipt to {0}', [pandora.user.email])
                        : Ox._('Don\'t send me a receipt')
                });
            }
        })
        .appendTo(that),

    $sendButton = Ox.Button({
            disabled: true,
            title: Ox._('Send Message'),
            width: 128
        })
        .css({float: 'left', margin: '8px 0 8px ' + (pandora.user.level == 'guest' ? width - 128 : 4) + 'px'})
        .bindEvent({
            click: function() {
                var data = $form.values();
                $sendButton.options({
                    disabled: true,
                    title: Ox._('Sending Message...')
                });
                pandora.api.contact({
                    name: data.name,
                    email: data.email,
                    subject: data.subject,
                    message: data.message,
                    receipt: $receiptCheckbox.value()
                }, function(result) {
                    var $dialog = pandora.ui.iconDialog({
                            buttons: [
                                Ox.Button({
                                    id: 'close',
                                    title: Ox._('Close')
                                }).bindEvent({
                                    click: function() {
                                        $dialog.close();
                                        $form.values({subject: '', message: ''});
                                    }
                                })
                            ],
                            keys: {enter: 'close', escape: 'close'},
                            text: Ox._('Thanks for your message!<br/><br/>We will get back to you as soon as possible.'),
                            title: Ox._('Message Sent')
                        })
                        .open();
                    $sendButton.options({
                        disabled: false,
                        title: Ox._('Send Message')
                    });
                });
                
            }
        })
        .appendTo(that),

    $text = $('<div>')
        .css({width: width + 'px'})
        .html(
            '&nbsp;' + Ox._('Alternatively, you can contact us via {0}',
            ['<a href="mailto:' + pandora.site.site.email.contact + '">'
            + pandora.site.site.email.contact + '</a>'])
        )
        .appendTo(that);
 
    pandora.user.level == 'guest' && $receiptCheckbox.hide();

    function getWidth() {
        return Math.min((
            pandora.$ui.siteDialog
            ? parseInt(pandora.$ui.siteDialog.css('width'))
            : Math.round(window.innerWidth * 0.75)
        ) - 304 - Ox.UI.SCROLLBAR_SIZE, 512);
    }

    that.resize = function() {
        var width = getWidth();
        $form.css({width: width + 'px'});
        $form.options('items').forEach(function($input, i) {
            i < 4 && $input.options({width: width});
        });
        if (pandora.user.level == 'guest') {
            $sendButton.css({marginLeft: width - 128 + 'px'});
        } else {
            $receiptCheckbox.options({width: width - 136});
        }
        $text.css({width: width + 'px'});
    }

    return that;

};
