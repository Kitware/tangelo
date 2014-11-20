QUnit.module("stream.js");

QUnit.test("Stream status at startup", function (assert) {
    "use strict";

    QUnit.stop();

    tangelo.plugin.stream.streams(function (streams) {
        assert.strictEqual(streams.length, 0, "At startup there should be zero streams running");
        QUnit.start();
    });
});

QUnit.test("Query a stream by hand", function (assert) {
    "use strict";

    QUnit.stop(7);

    tangelo.plugin.stream.start("/service/finite", function (key) {
        QUnit.start();

        assert.ok(key, "stream key should be non-null");

        tangelo.plugin.stream.query(key, function (value, done) {
            QUnit.start();

            assert.ok(!done, "Stream should not be out of data yet");
            assert.strictEqual(value, 1, "First value from service is 1");

            tangelo.plugin.stream.query(key, function (value, done) {
                QUnit.start();

                assert.ok(!done, "Stream should not be out of data yet");
                assert.strictEqual(value, 4, "Second value from service is 2");

                tangelo.plugin.stream.query(key, function (value, done) {
                    QUnit.start();

                    assert.ok(!done, "Stream should not be out of data yet");
                    assert.strictEqual(value, 9, "Third value from service is 9");

                    tangelo.plugin.stream.query(key, function (value, done) {
                        QUnit.start();

                        assert.ok(!done, "Stream should not be out of data yet");
                        assert.strictEqual(value, 16, "Fourth value from service is 16");

                        tangelo.plugin.stream.query(key, function (value, done) {
                            QUnit.start();

                            assert.ok(done, "Second parameter should indicate stream has run out");
                            assert.strictEqual(value, undefined, "Data should be undefined when stream has just run out");

                            tangelo.plugin.stream.streams(function (streams) {
                                QUnit.start();

                                assert.strictEqual(streams.length, 0, "After stream runs out, there should not be any stream keys");
                            });
                        });
                    });
                });
            });
        });
    });
});

QUnit.test("Run a stream", function (assert) {
    "use strict";

    QUnit.stop(5);

    var func1,
        func2,
        func3,
        func4,
        callCount = 0;

    func1 = function (data, finished) {
        QUnit.start();

        assert.strictEqual(callCount++, 0);
        assert.strictEqual(data, 1);
        assert.ok(!finished);

        return func2;
    };

    func2 = function (data, finished) {
        QUnit.start();

        assert.strictEqual(callCount++, 1);
        assert.strictEqual(data, 4);
        assert.ok(!finished);

        return func3;
    };

    func3 = function (data, finished) {
        QUnit.start();

        assert.strictEqual(callCount++, 2);
        assert.strictEqual(data, 9);
        assert.ok(!finished);

        return func4;
    };

    func4 = function (data, finished) {
        if (callCount > 4) {
            assert.ok(false);
        }

        QUnit.start();

        if (data !== undefined) {
            assert.strictEqual(callCount++, 3);
            assert.strictEqual(data, 16);
            assert.ok(!finished);
        } else {
            assert.strictEqual(callCount++, 4);
            assert.ok(!data);
            assert.ok(finished);
        }
    };

    tangelo.plugin.stream.start("/service/finite", function (key) {
        tangelo.plugin.stream.run(key, func1);
    });
});

QUnit.test("Delete a stream", function (assert) {
    "use strict";

    QUnit.stop(4);

    tangelo.plugin.stream.start("/service/finite", function (key) {
        QUnit.start();

        assert.ok(key, "Key should be non-null");

        tangelo.plugin.stream.streams(function (streams) {
            QUnit.start();

            assert.strictEqual(streams.length, 1, "There should be one stream in the list");

            tangelo.plugin.stream.delete(key, function (deleted) {
                QUnit.start();

                assert.strictEqual(key, deleted, "The key returned should be equal to the requested key");

                tangelo.plugin.stream.streams(function (streams) {
                    QUnit.start();

                    assert.strictEqual(streams.length, 0, "The list of streams should now be empty again");
                });
            });
        });
    });
});
