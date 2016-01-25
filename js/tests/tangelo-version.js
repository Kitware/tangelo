QUnit.module("Tangelo version");

(function () {
    "use strict";

    var expected = "0.10.0-dev";

    QUnit.test("Tangelo version is correct", function (assert) {
        var received = tangelo.version();

        assert.strictEqual(expected, received);
    });
}());
