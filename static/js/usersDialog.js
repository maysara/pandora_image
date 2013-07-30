// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.usersDialog = function() {

    var browsers = [
            'Camino', 'Chrome', 'Chrome Frame', 'Chromium', 'Epiphany',
            'Firefox', 'Internet Explorer', 'Konqueror', 'Nokia Browser',
            'Opera', 'Safari', 'WebKit'
        ],
        dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),
        formWidth = 256,
        numberOfUsers = 0,
        systems = [
            'Android', 'BlackBerry', 'BSD', 'iOS', 'Java', 'Linux', 'Mac OS X',
            'Nokia', 'PlayStation', 'RIM Tablet OS', 'Unix', 'Wii', 'Windows',
            'Windows Phone'
        ],
        userLevels = pandora.site.userLevels.map(function(userLevel) {
            return Ox.toTitleCase(userLevel);
        }).concat(['Robot']),

        $reloadButton = Ox.Button({
                disabled: true,
                title: 'redo',
                tooltip: Ox._('Reload'),
                type: 'image'
            })
            .css({float: 'left', margin: '4px 2px 4px 4px'})
            .bindEvent({
                click: function() {
                    $reloadButton.options({disabled: true});
                    Ox.Request.clearCache('findUsers');
                    $list.reloadList(true);
                }
            }),

        $guestsCheckbox = Ox.Checkbox({
                title: Ox._('Include Guests'),
                value: false
            })
            .css({float: 'left', margin: '4px 2px'})
            .bindEvent({
                change: function(data) {
                    data.value
                        ? $robotsCheckbox.show()
                        : $robotsCheckbox.hide().options({value: false});
                    updateList();
                }
            }),

        $robotsCheckbox = Ox.Checkbox({
                title: Ox._('Include Robots'),
                value: false
            })
            .css({float: 'left', margin: '4px 2px'})
            .hide()
            .bindEvent({
                change: updateList
            }),

        $findSelect = Ox.Select({
                items: [
                    {id: 'all', title: Ox._('Find: All')},
                    {id: 'username', title: Ox._('Find: Username')},
                    {id: 'email', title: Ox._('Find: E-Mail Address')}
                ],
                overlap: 'right',
                type: 'image'
            })
            .bindEvent({
                change: function(data) {
                    $findInput.value() && updateList();
                    $findInput.options({placeholder: data.title});
                }
            }),

        $findInput = Ox.Input({
                changeOnKeypress: true,
                clear: true,
                placeholder: Ox._('Find: All'),
                width: 192
            })
            .bindEvent({
                change: updateList
            }),

        $findElement = Ox.FormElementGroup({
                elements: [
                    $findSelect,
                    $findInput
                ]
            })
            .css({float: 'right', margin: '4px'}),

        $list = Ox.TableList({
                columns: [
                    {
                        format: function(value, data) {
                            return $('<img>')
                                .attr({
                                    src: Ox.UI.getImageURL('symbolCheck')
                                })
                                .css({
                                    width: '10px',
                                    height: '10px',
                                    padding: '3px',
                                    opacity: value || [
                                        'guest', 'robot'
                                    ].indexOf(data.level) > -1 ? 0 : 1
                                });
                        },
                        id: 'disabled',
                        operator: '-',
                        title: Ox._('Enabled'),
                        titleImage: 'check',
                        visible: true,
                        width: 16
                    },
                    {
                        format: function(value) {
                            return $('<img>')
                                .attr({
                                    src: Ox.UI.getImageURL('symbolMail')
                                })
                                .css({
                                    width: '10px',
                                    height: '10px',
                                    padding: '3px',
                                    opacity: +value
                                });
                        },
                        id: 'newsletter',
                        title: Ox._('Newsletter'),
                        titleImage: 'mail',
                        operator: '-',
                        visible: true,
                        width: 16
                    },
                    {
                        format: function(value, data) {
                            return '<span style="opacity: ' + (
                                data.disabled ? 0.5 : 1
                            ) + '">' + Ox.encodeHTMLEntities(value) + '</span>';
                        },
                        id: 'username',
                        operator: '+',
                        removable: false,
                        title: Ox._('Username'),
                        visible: true,
                        width: 128
                    },
                    {
                        format: function(value, data) {
                            return '<span style="opacity: ' + (
                                data.disabled ? 0.5 : 1
                            ) + '">' + value + '</span>';
                        },
                        id: 'email',
                        operator: '+',
                        title: Ox._('E-Mail Address'),
                        visible: true,
                        width: 192
                    },
                    {
                        align: 'center',
                        format: function(value) {
                            return Ox.Theme.formatColorLevel(
                                userLevels.indexOf(Ox.toTitleCase(value)),
                                userLevels,
                                [0, 300]
                            );
                        },
                        id: 'level',
                        operator: '-',
                        title: Ox._('Level'),
                        type: 'label',
                        visible: true,
                        width: 64
                    },
                    {
                        format: function(value) {
                            return Ox.Element({
                                    element: '<img>',
                                    tooltip: value
                                })
                                .attr({
                                    src: Ox.getFlagByGeoname(value, 16)
                                })
                                .css({
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '4px',
                                    marginLeft: '-3px',
                                    marginTop: 0
                                });
                        },
                        id: 'location',
                        operator: '+',
                        title: Ox._('Location'),
                        titleImage: 'flag',
                        visible: true,
                        width: 16
                    },
                    {
                        format: function(value) {
                            var system;
                            Ox.forEach(systems, function(s) {
                                if (new RegExp('^' + s).test(value)) {
                                    system = s;
                                    return false;
                                }
                            });
                            return system ? Ox.Element({
                                    element: '<img>',
                                    tooltip: value
                                        .replace(/BSD \((.+)\)/, '$1')
                                        .replace(/Linux \((.+)\)/, '$1')
                                        .replace(/Unix \((.+)\)/, '$1')
                                        .replace(/Windows (NT \d+\.\d+) \((.+)\)/, 'Windows $2 ($1)')
                                })
                                .attr({
                                    src: Ox.UI.PATH + 'png/system'
                                        + system.replace(/ /g, '') + '128.png'
                                })
                                .css({
                                    width: '14px',
                                    height: '14px',
                                    marginLeft: '-3px',
                                    marginTop: 0
                                }) : '';
                        },
                        id: 'system',
                        operator: '+',
                        title: Ox._('System'),
                        titleImage: 'square',
                        visible: true,
                        width: 16
                    },
                    {
                        format: function(value) {
                            var browser;
                            Ox.forEach(browsers, function(b) {
                                if (new RegExp('^' + b).test(value)) {
                                    browser = b;
                                    return false;
                                }
                            });
                            return browser ? Ox.Element({
                                    element: '<img>',
                                    tooltip: value
                                })
                                .attr({
                                    src: Ox.UI.PATH + 'png/browser'
                                        + browser.replace(/ /g, '') + '128.png'
                                })
                                .css({
                                    width: '14px',
                                    height: '14px',
                                    marginLeft: '-3px',
                                    marginTop: 0
                                }) : '';
                        },
                        id: 'browser',
                        operator: '+',
                        title: Ox._('Browser'),
                        titleImage: 'circle',
                        visible: true,
                        width: 16 
                    },
                    {
                        align: 'right',
                        format: function(value) {
                            return Ox.formatNumber(value);
                        },
                        id: 'timesseen',
                        operator: '-',
                        title: Ox._('Times Seen'),
                        visible: true,
                        width: 80
                    },
                    {
                        align: 'right',
                        format: function(value) {
                            return Ox.formatDate(value, '%F %T');
                        },
                        id: 'firstseen',
                        operator: '-',
                        title: Ox._('First Seen'),
                        visible: true,
                        width: 144
                    },
                    {
                        align: 'right',
                        format: function(value) {
                            return Ox.formatDate(value, '%F %T');
                        },
                        id: 'lastseen',
                        operator: '-',
                        title: Ox._('Last Seen'),
                        visible: true,
                        width: 144
                    },
                    {
                        align: 'right',
                        format: function(value, data) {
                            return ['guest', 'robot'].indexOf(data.level) > -1
                                ? '' : value;
                        },
                        id: 'numberoflists',
                        operator: '-',
                        title: Ox._('Lists'),
                        visible: true,
                        width: 64
                    },
                    {
                        id: 'groups',
                        operator: '+',
                        title: Ox._('Groups'),
                        visible: true,
                        width: 64
                    },
                    {
                        id: 'screensize',
                        align: 'right',
                        operator: '-',
                        title: Ox._('Screen Size'),
                        visible: true,
                        width: 80
                    },
                    {
                        align: 'right',
                        id: 'windowsize',
                        operator: '-',
                        title: Ox._('Window Size'),
                        visible: true,
                        width: 80
                    },
                    {
                        align: 'right',
                        id: 'ip',
                        operator: '+',
                        title: Ox._('IP Address'),
                        visible: true,
                        width: 128
                    },
                    {
                        id: 'useragent',
                        operator: '+',
                        title: Ox._('User Agent'),
                        visible: true,
                        width: 768
                    }
                ],
                columnsRemovable: true,
                columnsVisible: true,
                items: pandora.api.findUsers,
                query: {
                    conditions: [
                        {key: 'level', value: 'guest', operator: '!='},
                        {key: 'level', value: 'robot', operator: '!='}
                    ],
                    operator: '&'
                },
                keys: ['notes', 'groups'],
                max: -1,
                scrollbarVisible: true,
                sort: [{key: 'lastseen', operator: '-'}],
                unique: 'id'
            })
            .bindEvent({
                init: function(data) {
                    numberOfUsers = data.users;
                    $status.html(
                        Ox.formatNumber(data.items)
                        + ' user' + (data.items == 1 ? '' : 's')
                        + (
                            $guestsCheckbox.value()
                            ? ' (' + Ox.formatNumber(data.users) + ' registered, '
                                + Ox.formatNumber(data.guests) + ' guest'
                                + (data.guests == 1 ? '' : 's')
                                + (
                                    $robotsCheckbox.value()
                                    ? ', '
                                        + Ox.formatNumber(data.robots) + ' robot'
                                        + (data.robots == 1 ? '' : 's')
                                    : ''
                                ) + ')'
                            : ''
                        )
                    );
                },
                load: function() {
                    $reloadButton.options({disabled: false});
                },
                select: selectUsers
            }),

        $formLabel = Ox.Label({
                textAlign: 'center',
                title: Ox._('No user selected'),
                width: 212
            })
            .css({float: 'left', margin: '4px 2px 4px 4px'}),

        $formButton = Ox.ButtonGroup({
                buttons: [
                    {
                        id: 'edit',
                        selected: true,
                        title: 'edit',
                        tooltip: Ox._('Edit')
                    },
                    {
                        id: 'mail',
                        title: 'mail',
                        tooltip: Ox._('Mail')
                    }
                ],
                selectable: true,
                type: 'image'
            })
            .css({float: 'left', margin: '4px 4px 4px 2px'})
            .bindEvent({
                change: selectForm
            }),

        $form = Ox.Element(),

        $editForm,

        $sendButton = Ox.Button({
                disabled: true,
                id: 'send',
                title: Ox._('Send'),
                width: 64
            })
            .bindEvent({
                click: sendMail
            }),

        $mailForm = renderMailForm(),

        $content = Ox.SplitPanel({
            elements: [
                {
                    element: Ox.SplitPanel({
                        elements: [
                            {
                                element: Ox.Bar({size: 24})
                                    .append($reloadButton)
                                    .append($guestsCheckbox)
                                    .append($robotsCheckbox)
                                    .append($findElement),
                                size: 24
                            },
                            {
                                element: $list
                            }
                        ],
                        orientation: 'vertical'
                    })
                },
                {
                    element: Ox.SplitPanel({
                            elements: [
                                {
                                    element: Ox.Bar({size: 24})
                                        .append($formLabel)
                                        .append($formButton),
                                    size: 24
                                },
                                {
                                    element: $form
                                }
                            ],
                            orientation: 'vertical'
                        })
                        .bindEvent({
                            resize: setWidth
                        }),
                    resizable: true,
                    resize: [256, 384, 512],
                    size: 256
                }
            ],
            orientation: 'horizontal'
        }),

        that = Ox.Dialog({
                buttons: [
                    Ox.Button({
                        id: 'statistics',
                        title: Ox._('Statistics...')
                    }).bindEvent({
                        click: function() {
                            that.close();
                            pandora.$ui.statisticsDialog = pandora.ui.statisticsDialog().open();
                        }
                    }),
                    {},
                    Ox.Button({
                            title: Ox._('Export E-Mail Addresses')
                        })
                        .css({margin: '4px 4px 4px 0'})
                        .bindEvent({
                            click: function() {
                                pandora.api.findUsers({
                                    query: {conditions: [], operator: '&'},
                                    keys: ['email', 'username'],
                                    range: [0, numberOfUsers],
                                    sort: [{key: 'username', operator: '+'}]
                                }, function(result) {
                                    var $dialog = Ox.Dialog({
                                            buttons: [
                                                Ox.Button({
                                                        title: Ox._('Close')
                                                    })
                                                    .bindEvent({
                                                        click: function() {
                                                            $dialog.close();
                                                        }
                                                    })
                                            ],
                                            content: Ox.Element()
                                                .addClass('OxSelectable')
                                                .css({margin: '16px'})
                                                .html(
                                                    result.data.items.filter(function(item) {
                                                        return item.email;
                                                    }).map(function(item) {
                                                        return Ox.encodeHTMLEntities(item.username)
                                                            + ' &lt;' + item.email + '&gt;';
                                                    }).join(', ')
                                                ),
                                            removeOnClose: true,
                                            title: Ox._('E-Mail Addresses')
                                        })
                                        .open();
                                });
                            }
                        }),
                    Ox.Button({
                            id: 'done',
                            title: Ox._('Done'),
                            width: 48
                        }).bindEvent({
                            click: function() {
                                that.close();
                            }
                        })
                ],
                closeButton: true,
                content: $content,
                height: dialogHeight,
                maximizeButton: true,
                minHeight: 256,
                minWidth: 512,
                padding: 0,
                removeOnClose: true,
                title: Ox._('Manage Users'),
                width: dialogWidth
            })
            .bindEvent({
                resize: setHeight
            }),

        $status = $('<div>')
            .css({
                position: 'absolute',
                top: '4px',
                left: '128px',
                right: '384px',
                bottom: '4px',
                paddingTop: '2px',
                fontSize: '9px',
                textAlign: 'center'
            })
            .appendTo(that.find('.OxButtonsbar'));

    that.superClose = that.close;
    that.close = function() {
        Ox.Request.clearCache('findUsers');
        that.superClose();
    };

    function getFormItemById(id) {
        var ret;
        Ox.forEach((
            $formButton.value() == 'edit' ? $editForm : $mailForm
        ).options('items'), function($item) {
            if ($item.options('id') == id) {
                ret = $item;
                return false;
            }
        });
        return ret;
    };

    function getTo() {
        return $list.options('selected').map(function(id) {
            return $list.value(id);
        }).filter(function(user) {
            return ['guest', 'robot'].indexOf(user.level) == -1 && (
                $mailForm.values().include == 'users' || user.newsletter
            );
        }).map(function(user) {
            return user.username;
        });
    }

    function renderEditForm() {
        var user = $list.value($list.options('selected')[0]);
        return Ox.Form({
            items: [
                Ox.Checkbox({
                        id: 'status',
                        label: Ox._('Status'),
                        labelWidth: 80,
                        title: !user.disabled ? Ox._('Enabled') : Ox._('Disabled'),
                        value: !user.disabled,
                        width: formWidth - 16
                    })
                    .bindEvent({
                        change: function(data) {
                            this.options({
                                title: this.options('title') == Ox._('Enabled')
                                    ? Ox._('Disabled') : Ox._('Enabled')
                            });
                        }
                    }),
                Ox.Input({
                        id: 'username',
                        label: Ox._('Username'),
                        labelWidth: 80,
                        value: user.username,
                        width: formWidth - 16
                    })
                    .bindEvent({
                        submit: function(data) {
                            
                        }
                    }),
                Ox.Input({
                        id: 'email',
                        label: Ox._('E-Mail'),
                        labelWidth: 80,
                        value: user.email,
                        width: formWidth - 16
                    })
                    .bindEvent({
                        submit: function(data) {

                        }
                    }),
                Ox.Select({
                    id: 'level',
                    items: pandora.site.userLevels.slice(1).map(function(level) {
                        return {
                            id: level,
                            title: Ox.toTitleCase(level)
                        };
                    }),
                    label: Ox._('Level'),
                    labelWidth: 80,
                    value: user.level,
                    width: formWidth - 16
                }),
                Ox.Checkbox({
                        id: 'newsletter',
                        label: Ox._('Newsletter'),
                        labelWidth: 80,
                        title: user.newsletter ? Ox._('Subscribed') : Ox._('Unsubscribed'),
                        value: user.newsletter,
                        width: formWidth - 16
                    })
                    .bindEvent({
                        change: function(data) {
                            this.options({
                                title: this.options('title') == Ox._('Subscribed')
                                    ? Ox._('Unsubscribed') : Ox._('Subscribed')
                            });
                        }
                    }),
                Ox.Input({
                        id: 'groups',
                        label: Ox._('Groups'),
                        labelWidth: 80,
                        value: user.groups ? user.groups.join(', ') : '',
                        width: formWidth - 16
                    })
                    .bindEvent({
                        submit: function(data) {

                        }
                    }),
                Ox.Input({
                    height: dialogHeight - 184,
                    id: 'notes',
                    placeholder: Ox._('Notes'),
                    type: 'textarea',
                    value: user.notes,
                    width: formWidth - 16
                })
            ],
            width: 240
        })
        .css({margin: '8px'})
        .bindEvent({
            change: function(event) {
                var data = {id: user.id}, key, value;
                if (event.id == 'status') {
                    data.disabled = !event.data.value;
                } else if (event.id == 'level') {
                    data.level = event.data.value;
                } else if (event.id == 'newsletter') {
                    data.newsletter = event.data.value;
                } else if (event.id == 'groups') {
                    data.groups = event.data.value.split(', ');
                } else {
                    data[event.id] = event.data.value;
                }
                if (event.id == 'status') {
                    $list.value(user.id, 'disabled', data.disabled);
                } else {
                    $list.value(user.id, event.id, data[event.id]);
                }
                pandora.api.editUser(data, function(result) {
                    Ox.Request.clearCache('findUsers');
                });
            }
        });
    }

    function renderMailForm() {
        return Ox.Form({
            items: [
                Ox.Input({
                    disabled: true,
                    id: 'from',
                    label: Ox._('From'),
                    labelWidth: 80,
                    value: pandora.site.site.name + ' <' + pandora.site.site.email.contact + '>',
                    width: formWidth - 16
                }),
                Ox.Input({
                    disabled: true,
                    id: 'to',
                    label: Ox._('To'),
                    labelWidth: 80,
                    value: '',
                    width: formWidth - 16
                }),
                Ox.Select({
                        id: 'include',
                        items: [
                            {id: 'users', title: Ox._('All users')},
                            {id: 'subscribers', title: Ox._('Subscribers only')},
                        ],
                        label: Ox._('Include'),
                        labelWidth: 80,
                        width: formWidth - 16
                    })
                    .bindEvent({
                        change: function() {
                            setTo();
                            setSend();
                        }
                    }),
                Ox.Input({
                        id: 'subject',
                        label: Ox._('Subject'),
                        labelWidth: 80,
                        value: pandora.site.site.email.prefix + ' ',
                        width: formWidth - 16
                    })
                    .bindEvent({
                        change: setSend
                    }),
                Ox.Input({
                        height: dialogHeight - 208,
                        id: 'message',
                        placeholder: Ox._('Message'),
                        type: 'textarea',
                        value: '\n\n' + pandora.site.site.email.footer,
                        width: formWidth - 16
                    })
                    .bindEvent({
                        change: setSend
                    }),
                Ox.MenuButton({
                        id: 'insert',
                        items: [
                            {id: 'username', title: Ox._('Username')},
                            {id: 'email', title: Ox._('E-Mail Address')},
                        ],
                        title: Ox._('Insert...'),
                        width: formWidth - 16
                    })
                    .bindEvent({
                        click: function(data) {
                            var $input = getFormItemById('message'),
                                textarea = $input.find('textarea')[0],
                                value = $input.value();
                            $input.value(
                                    value.slice(0, textarea.selectionStart)
                                    + '{' + data.id + '}'
                                    + value.slice(textarea.selectionEnd)
                                )
                                .focusInput(textarea.selectionStart + data.id.length + 2);                           
                        }
                    }),
                Ox.Checkbox({
                    id: 'receipt',
                    title: Ox._('Send a receipt to {0}', [pandora.user.email]),
                    value: false,
                    width: formWidth - 16
                }),
                $sendButton
            ],
            width: formWidth - 16
        })
        .css({margin: '8px', textAlign: 'right'});
    }

    function selectForm(data) {
        var selected;
        if (data.value == 'edit') {
            $mailForm.detach();
            selected = $list.options('selected');
            if (selected.length == 1 && ['guest', 'robot'].indexOf(selected[0].level) == -1) {
                $form.append($editForm = renderEditForm());
            }
        } else {
            setTo();
            setSend();
            setWidth();
            $editForm && $editForm.remove();
            $form.append($mailForm);
        }
    }

    function selectUsers(data) {
        var users = data.ids.map(function(id) {
            return $list.value(id);
        });
        setLabel();
        if ($formButton.value() == 'edit') {
            $form.empty();
            if (
                data.ids.length == 1
                && ['guest', 'robot'].indexOf(users[0].level) == -1
            ) {
                $form.append($editForm = renderEditForm());
            }
        } else {
            setTo();
            setSend();
        }
    }

    function sendMail() {
        $sendButton.options({title: Ox._('Sending'), disabled: true});
        pandora.api.mail({
            to: getTo(),
            subject: getFormItemById('subject').value(),
            message: getFormItemById('message').value(),
            receipt: getFormItemById('receipt').value()
        }, function(result) {
            var $dialog = pandora.ui.iconDialog({
                    buttons: [
                        Ox.Button({
                            id: 'close',
                            title: Ox._('Close')
                        })
                        .bindEvent({
                            click: function() {
                                $dialog.close();
                            }
                        })
                    ],
                    keys: {enter: 'close', escape: 'close'},
                    text: result.status.code == 200
                        ? Ox._('Your message has been sent.')
                        : Ox._('Your message could not be sent. Please try again.'),
                    title: result.status.code == 200
                        ? Ox._('Message Sent')
                        : Ox._('Application Error')
                }).open();
            $sendButton.options({title: Ox._('Send'), disabled: false});
        });
    }

    function setHeight(data) {
        var form = $formButton.value(),
            $item = getFormItemById(form == 'edit' ? 'notes' : 'message');
        dialogHeight = data.height;
        $item && $item.options({
            height: dialogHeight - (form == 'edit' ? 160 : 208)
        });
    }

    function setLabel() {
        var users = $list.options('selected').map(function(id) {
                return $list.value(id);
            }),
            title = users.length == 0 ? Ox._('No user selected')
                : users.length == 1 ? (
                    ['guest', 'robot'].indexOf(users[0].level) > -1
                    ? Ox.toTitleCase(users[0].level)
                    : Ox.encodeHTMLEntities(users[0].username)
                        + ' &lt;' + users[0].email + '&gt;'
                )
                : Ox._('{0} users selected', [users.length]);
        $formLabel.options({title: title});
    }

    function setSend() {
        getFormItemById('send').options({
            disabled: getFormItemById('to').value() == Ox._('No recipients')
                || getFormItemById('subject').value() === ''
                || getFormItemById('message').value() === ''
        }); 
    }

    function setTo() {
        var recipients = getTo().length;
        $mailForm.values({
            to: Ox.formatCount(recipients, 'recipient').replace('no', 'No')
        });
    }

    function setWidth() {
        var $form = $formButton.value() == 'edit' ? $editForm : $mailForm;
        formWidth = $content.size(1);
        $formLabel.options({width: formWidth - 44});
        $form && $form.options('items').forEach(function($item) {
            if ($item.options('id') != 'send') {
                $item.options({width: formWidth - 16});
            }
        });
        $status.css({right: formWidth + 128 + 'px'});
    }

    function updateList() {
        var guests = $guestsCheckbox.value(),
            robots = $robotsCheckbox.value(),
            key = $findSelect.value(),
            value = $findInput.value(),
            query = {
                conditions: value
                    ? [].concat(
                        key != 'email' ? [{key: 'username', value: value, operator: '='}] : [],
                        key != 'username' ? [{key: 'email', value: value, operator: '='}] : []
                    )
                    : [].concat(
                        !guests ? [{key: 'level', value: 'guest', operator: '!='}] : [],
                        !robots ? [{key: 'level', value: 'robot', operator: '!='}] : []
                    ),
                operator: key == 'all' && value ? '|' : '&'
            };
        $list.options({query: query});
    }

    return that;

};

