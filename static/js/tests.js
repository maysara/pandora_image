// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.tests = function() {
    var tests = [];
    pandora.api.find({
        query: {conditions: [{key: 'rendered', value: true, operator: '='}], operator: '&'},
        sort: [{key: 'random', operator:'+'}],
        keys: ['id', 'duration'],
        range: [0, 10]
    }, function(result) {
        var item = result.data.items.filter(function(item) { return item.duration > 300; })[0],
            position = 60;
        pandora.UI.set('videoPoints.' + item.id, {
            annotation: '',
            'in': position,
            out: position,
            position: position
        });
        pandora.UI.set({item: item.id, itemView: 'player'});
        test('set item', pandora.user.ui.item, item.id);
        startPlayback();
        function startPlayback() {
            if (pandora.$ui.player) {
                pandora.$ui.player.options({paused: false});
                setTimeout(function() {
                    pandora.$ui.player.options({paused: true});
                    test('video position increased after playback', pandora.user.ui.videoPoints[item.id].position > position, true);
                    results();
                }, 5000);
            } else {
                setTimeout(startPlayback, 500);
            }
        }
    });

    function test(title, actual, expected) {
        tests.push({
            actual: actual,
            expected: expected,
            passed: Ox.isEqual(actual, expected),
            title: title
        })
    }

    function results() {
        var passed = tests.filter(function(test) {
            return test.passed;
        }).length,
            failed = tests.length - passed;
            Ox.print(JSON.stringify({
                tests: tests.length,
                passed: passed,
                failed: failed,
                results: tests
            }, null, '  '));
    }
}
