// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.accountDialog = function(action) {
    var that = Ox.Dialog(Ox.extend({
            fixedSize: true,
            height: 192,
            id: 'accountDialog',
            removeOnClose: true,
            width: 432
        }, pandora.ui.accountDialogOptions(action)))
        .bindEvent({
            open: function() {
                pandora.$ui.accountForm.find('input')[0].focus();
            },
            resize: function(data) {
                var width = data.width - 32;
                pandora.$ui.accountForm.items.forEach(function(item) {
                    item.options({width: width});
                });
            }
        });
    return that;
};

pandora.ui.accountDialogOptions = function(action, value) {
    //Ox.Log('', 'ACTION', action)
    pandora.$ui.accountForm && pandora.$ui.accountForm.remove();
    var buttons = {
            signin: ['signup', 'reset'],
            signup: ['signin'],
            reset: ['signin'],
            resetAndSignin: []
        },
        buttonTitle = {
            signin: 'Sign In',
            signup: 'Sign Up',
            reset: 'Reset Password',
            resetAndSignin: 'Sign In'
        },
        dialogText = {
            signin: Ox._('To sign in to your account, please enter your username and password.'),
            signup: Ox._('To sign up for an account, please choose a username and password, and enter your e-mail address.'),
            reset: Ox._('To reset your password, please enter either your username or your e-mail address.'),
            resetAndSignin: Ox._('To sign in to your account, please choose a new password, and enter the code that we have just e-mailed to you.')
        },
        dialogTitle = {
            signin: Ox._('Sign In'),
            signup: Ox._('Sign Up'),
            reset: Ox._('Reset Password'),
            resetAndSignin: Ox._('Reset Password')
        };
    function button(type) {
        if (type == 'cancel') {
            return Ox.Button({
                id: 'cancel' + Ox.toTitleCase(action),
                title: Ox._('Cancel')
            }).bindEvent({
                click: function() {
                    pandora.$ui.accountDialog.close();
                    pandora.UI.set({page: ''});
                }
            });
        } else if (type == 'submit') {
            return Ox.Button({
                disabled: true,
                id: 'submit' + Ox.toTitleCase(action),
                title: Ox._(buttonTitle[action])
            }).bindEvent({
                click: function() {
                    pandora.$ui.accountForm.submit();
                }
            });
        } else {
            return Ox.Button({
                id: type,
                title: Ox._(buttonTitle[type] + '...')
            }).bindEvent({
                click: function() {
                    if (['signin', 'signup'].indexOf(type) > -1 && type != pandora.user.ui.page) {
                        pandora.UI.set({page: type});
                    } else {
                        pandora.$ui.accountDialog.options(pandora.ui.accountDialogOptions(type));
                    }
                    pandora.$ui.accountForm.find('input.OxInput')[0].focus();
                }
            });
        }
    }

    return {
        buttons: [].concat(
            buttons[action].map(function(type) {
                return button(type);
            }),
            buttons[action].length ? [{}] : [],
            [button('cancel'), button('submit')]
        ),
        content: Ox.Element()
            .append(
                $('<img>')
                    .attr({src: '/static/png/icon.png'})
                    .css({position: 'absolute', left: '16px', top: '16px', width: '64px', height: '64px'})
            )
            .append(
                Ox.Element()
                    .css({position: 'absolute', left: '96px', top: '16px', width: '320px'})
                    .append(
                        Ox.Element()
                            .addClass('OxText')
                            .html(dialogText[action] + '<br/><br/>')
                    )
                    .append(
                        pandora.$ui.accountForm = pandora.ui.accountForm(action, value)
                    )
            ),
        keys: {
            enter: 'submit' + Ox.toTitleCase(action),
            escape: 'cancel' + Ox.toTitleCase(action)
        },
        title: dialogTitle[action]
    };
};

pandora.ui.accountForm = function(action, value) {
    if (pandora.$ui.accountForm) {
        pandora.$ui.accountForm.items.forEach(function(item) {
            item.remove();
        });
    }
    var items = {
            'signin': ['username', 'password'],
            'signup': ['newUsername', 'password', 'email'],
            'reset': ['usernameOrEmail'],
            'resetAndSignin': ['oldUsername', 'newPassword', 'code']
        },
        $items = items[action].map(function(v) {
            return item(v, value);
        }),
        that = Ox.Form({
            id: 'accountForm' + Ox.toTitleCase(action),
            items: $items
        }).bindEvent({
            submit: function(data) {
                pandora.$ui.accountDialog.disableButtons();
                if (action == 'signin') {
                    pandora.api.signin(data.values, function(result) {
                        if (!result.data.errors) {
                            pandora.$ui.accountDialog.close();
                            pandora.signin(result.data);
                        } else {
                            pandora.$ui.accountDialog.enableButtons();
                            that.setMessages([{id: 'password', message: Ox._('Incorrect password')}]);
                        }
                    });
                } else if (action == 'signup') {
                    pandora.api.signup(data.values, function(result) {
                        if (!result.data.errors) {
                            pandora.$ui.accountDialog.close();
                            pandora.signin(result.data);
                            pandora.ui.accountWelcomeDialog().open();
                        } else {
                            pandora.$ui.accountDialog.enableButtons();
                            that.setMessages([{id: 'password', message: result.data.errors.toString()}]); // fixme
                        }
                    });
                } else if (action == 'reset') {
                    var usernameOrEmail = data.values.usernameOrEmail,
                        key = usernameOrEmail[0];
                    data = {};
                    data[key] = usernameOrEmail[1];
                    pandora.api.requestToken(data, function(result) {
                        if (!result.data.errors) {
                            pandora.$ui.accountDialog.options(pandora.ui.accountDialogOptions('resetAndSignin', result.data.username));
                            pandora.$ui.accountDialog.enableButtons();
                        } else {
                            pandora.$ui.accountDialog.enableButtons();
                            that.setMessages([{id: 'usernameOrEmail', message: Ox._('Unknown ' + (key == 'username' ? 'username' : 'e-mail address'))}])
                        }
                    });
                } else if (action == 'resetAndSignin') {
                    pandora.api.resetPassword(data.values, function(result) {
                        if (!result.data.errors) {
                            pandora.$ui.accountDialog.close();
                            pandora.signin(result.data);
                        } else {
                            pandora.$ui.accountDialog.enableButtons();
                            that.setMessages([{id: 'code', message: Ox._('Incorrect code')}]);
                        }
                    });
                }
                
            },
            validate: function(data) {
                pandora.$ui.accountDialog[
                    (data.valid ? 'enable' : 'disable') + 'Button'
                ]('submit' + Ox.toTitleCase(action));
            }
        });
    that.items = $items;
    function item(type, value) {
        if (type == 'code') {
            return Ox.Input({
                autovalidate: pandora.autovalidateCode,
                id: 'code',
                label: Ox._('Code'),
                labelWidth: 120,
                validate: pandora.validateCode,
                width: 320
            });
        } else if (type == 'email') {
            return Ox.Input({
                autovalidate: pandora.autovalidateEmail,
                id: 'email',
                label: Ox._('E-Mail Address'),
                labelWidth: 120,
                type: 'email', // fixme: ??
                validate: pandora.validateUser('email'),
                width: 320
            });
        } else if (type == 'newPassword') {
            return Ox.Input({
                autovalidate: /.+/,
                id: 'password',
                label: Ox._('New Password'),
                labelWidth: 120,
                type: 'password',
                validate: pandora.validateNewPassword,
                width: 320
            });
        } else if (type == 'newUsername') {
            return Ox.Input({
                autovalidate: pandora.autovalidateUsername,
                id: 'username',
                label: Ox._('Username'),
                labelWidth: 120,
                validate: pandora.validateUser('username'),
                width: 320
            });
        } else if (type == 'oldUsername') {
            return Ox.Input({
                disabled: true,
                id: 'username',
                label: Ox._('Username'),
                labelWidth: 120,
                value: value,
                width: 320
            });
        } else if (type == 'password') {
            return Ox.Input({
                autovalidate: /.+/,
                id: 'password',
                label: Ox._('Password'),
                labelWidth: 120,
                type: 'password',
                validate: pandora.validatePassword,
                width: 320
            });
        } else if (type == 'username') {
            return Ox.Input({
                autovalidate: pandora.autovalidateUsername,
                id: 'username',
                label: Ox._('Username'),
                labelWidth: 120,
                validate: pandora.validateUser('username', true),
                width: 320
            });
        } else if (type == 'usernameOrEmail') {
            return Ox.FormElementGroup({
                id: 'usernameOrEmail',
                elements: [
                    pandora.$ui.usernameOrEmailSelect = Ox.Select({
                            id: 'usernameOrEmailSelect',
                            items: [
                                {id: 'username', title: Ox._('Username')},
                                {id: 'email', title: Ox._('E-Mail Address')},
                            ],
                            overlap: 'right',
                            width: 128
                        })
                        .bindEvent({
                            change: function(data) {
                                pandora.$ui.usernameOrEmailInput.options({
                                    autovalidate: data.value == 'username'
                                        ? pandora.autovalidateUsername : pandora.autovalidateEmail,
                                    validate: pandora.validateUser(data.value, true),
                                    value: ''
                                }).focusInput(true);
                                that.find('.OxFormMessage:visible').html('').hide();
                                pandora.$ui.accountDialog.disableButton('submitReset');
                            }
                        }),
                    pandora.$ui.usernameOrEmailInput = Ox.Input({
                        autovalidate: pandora.autovalidateUsername,
                        id: 'usernameOrEmailInput',
                        validate: pandora.validateUser('username', true),
                        width: 192
                    })
                ],
                separators: [
                    {title: '', width: 0}
                ],
                validate: function(value, callback) {
                    pandora.validateUser(value[0], true)(value[1], callback);
                }
            });
        }
    }
    return that;
};

pandora.ui.accountSignoutDialog = function() {
    var that = Ox.Dialog({
        buttons: [
            Ox.Button({
                id: 'stay',
                title: Ox._('Stay Signed In')
            }).bindEvent({
                click: function() {
                    that.close();
                    pandora.UI.set({page: ''});
                }
            }),
            Ox.Button({
                id: 'signout',
                title: Ox._('Sign Out')
            }).bindEvent({
                click: function() {
                    that.close();
                    pandora.UI.set({page: ''});
                    pandora.api.signout({}, function(result) {
                        pandora.signout(result.data);
                    });
                }
            })
        ],
        content: Ox.Element()
            .append(
                $('<img>')
                    .attr({src: '/static/png/icon.png'})
                    .css({position: 'absolute', left: '16px', top: '16px', width: '64px', height: '64px'})
            )
            .append(
                $('<div>')
                    .css({position: 'absolute', left: '96px', top: '16px', width: '192px'})
                    .html(Ox._('Are you sure you want to sign out?'))
            ),
        fixedSize: true,
        height: 128,
        keys: {enter: 'signout', escape: 'stay'},
        removeOnClose: true,
        title: Ox._('Sign Out'),
        width: 304
    });
    return that;
};

pandora.ui.accountWelcomeDialog = function() {
    var that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'preferences',
                    title: Ox._('Preferences...')
                }).bindEvent('click', function() {
                    that.close();
                    pandora.$ui.preferencesDialog = pandora.ui.preferencesDialog().open();
                }),
                {},
                Ox.Button({
                    id: 'close',
                    title: Ox._('Close')
                }).bindEvent('click', function() {
                    that.close();
                })
            ],
            content: Ox.Element()
                .append(
                    $('<img>')
                        .attr({src: '/static/png/icon.png'})
                        .css({position: 'absolute', left: '16px', top: '16px', width: '64px', height: '64px'})
                )
                .append(
                    Ox.Element()
                        .css({position: 'absolute', left: '96px', top: '16px', width: '192px'})
                        .html(Ox._(
                            'Welcome, {0}!<br/><br/>Your account has been created.',
                            [Ox.encodeHTMLEntities(pandora.user.username)]
                        ))
                ),
            fixedSize: true,
            height: 128,
            keys: {enter: 'close', escape: 'close'},
            removeOnClose: true,
            title: Ox._('Welcome to {0}', [pandora.site.site.name]),
            width: 304
        });
    return that;
};

