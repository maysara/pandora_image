// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.autovalidateCode = function(value, blur, callback) {
    value = value.toUpperCase().split('').map(function(v) {
        return /[A-Z]/.test(v) ? v : null;
    }).join('').slice(0, 16);
    callback({valid: value.length == 16, value: value});
};

pandora.autovalidateEmail = function(value, blur, callback) {
    value = value.toLowerCase().split('').map(function(v, i) {
        return /[0-9a-z\.\+\-_@]/.test(v) ? v : null;
    }).join('').slice(0, 255);
    callback({valid: Ox.isValidEmail(value), value: value});
};

pandora.autovalidateListname = function(value, blur, callback) {
    // A valid listname consists of 1 to 255 unicode characters,
    // without leading, trailing or consecutive spaces
    var length = value.length;
    value = value.toLowerCase().split('').map(function(v, i) {
        return /\s/.test(v) && (i == 0 || (i == length - 1 && blur)) ? null : v;
    }).join('');
    value = value.replace(/\s+/g, ' ').slice(0, 255);
    callback({valid: !!value.length, value: value});
};

pandora.autovalidateUsername = function(value, blur, callback) {
    // A valid username consists of 1 to 255 unicode characters,
    // without leading, trailing or consecutive spaces
    var length = value.length;
    value = value.toLowerCase().split('').map(function(v, i) {
        return /\s/.test(v) && (i == 0 || (i == length - 1 && blur)) ? null : v;
    }).join('');
    value = value.replace(/\s+/g, ' ').slice(0, 255);
    callback({valid: !!value.length, value: value});
};

pandora.validateCode = function(value, callback) {
    callback({
        message: '',
        // message: 'Missing code',
        valid: value.length > 0
    });
};

pandora.validateNewEmail = function(value, callback) {
    value == pandora.user.email ? callback({
        message: '',
        valid: true
    }) : Ox.isValidEmail(value) ? pandora.api.findUser({
        key: 'email',
        value: value,
        operator: '=='
    }, function(result) {
        callback({
            message: Ox._('E-Mail Address already exists'),
            valid: !result.data.users.length
        });
    }) : callback({
        message: value.length ? Ox._('Invalid e-mail address') : '',
        // message: (!value.length ? 'Missing' : 'Invalid') + ' e-mail address',
        valid: false
    });
};

pandora.validateNewPassword = function(value, callback) {
    callback({
        message: '',
        // message: 'Missing password',
        valid: value.length > 0,
        value: value
    });
};

pandora.validatePassword = function(value, callback) {
    callback({
        message: '',
        // message: 'Missing password',
        valid: value.length > 0,
        value: value
    });
};

pandora.validateUser = function(key, existing) {
    existing = existing || false;
    var string = key == 'username' ? 'username' : 'e-mail address';
    return function(value, callback) {
        var valid = key == 'username' ? !!value.length : Ox.isValidEmail(value);
        valid ? pandora.api.findUser({
            key: key,
            value: value,
            operator: '=='
        }, function(result) {
            var valid = existing == !!result.data.users.length;
            callback({
                message: existing ?
                    Ox._('Unknown ' + string) :
                    Ox._(string[0].toUpperCase() + string.slice(1) + ' already exists'),
                valid: valid
            });
        }) : callback({
            message: value.length ? Ox._('Invalid ' + string) : '',
            // message: (!value.length ? 'Missing' : 'Invalid') + ' ' + string,
            valid: false
        });
    };
};

