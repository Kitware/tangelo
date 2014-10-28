QUnit.module("tangelo.isBoolean()");

QUnit.test("'true' is a boolean", function (assert) {
    "use strict";

    assert.expect(1);

    assert.ok(tangelo.isBoolean(true));
});

QUnit.test("'false' is a boolean", function (assert) {
    "use strict";

    assert.expect(1);

    assert.ok(tangelo.isBoolean(false));
});

QUnit.test("numbers are not boolean", function (assert) {
    "use strict";

    assert.expect(1);

    assert.ok(!tangelo.isBoolean(450));
});
