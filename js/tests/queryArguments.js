QUnit.module("tangelo.queryArguments()");

QUnit.test("tangelo.queryArguments()", function (assert) {
    "use strict";

    var qargs = tangelo.queryArguments();

    assert.deepEqual(qargs, {
        coverage: "true",
        lights: "4"
    });
});
