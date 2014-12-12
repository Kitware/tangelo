QUnit.module("Tangelo version");

(function () {
    "use strict";

    var version = "0.8.0-dev";

    QUnit.test("Tangelo version is correct", function (assert) {
        var myVersion = tangelo.version();

        assert.strictEqual(myVersion, version);
    });
}());
