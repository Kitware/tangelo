QUnit.module("Tangelo exists");

QUnit.test("'tangelo' is not undefined", function (assert) {
    "use strict";

    assert.notStrictEqual(tangelo, undefined);
});
