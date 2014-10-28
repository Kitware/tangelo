QUnit.module("isFunction()");

QUnit.test("Functions are functions", function (assert) {
    "use strict";

    assert.ok(tangelo.isFunction(tangelo.isFunction));
});

QUnit.test("Numbers are not functions", function (assert) {
    "use strict";

    assert.ok(!tangelo.isFunction(42));
});

QUnit.test("null is not a function", function (assert) {
    "use strict";

    assert.ok(!tangelo.isFunction(null));
});

QUnit.test("Blank argument list is not a function", function (assert) {
    "use strict";

    assert.ok(!tangelo.isFunction());
});
