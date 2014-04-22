/*globals describe, it, expect, tangelo */

describe("isFunction()", function () {
    "use strict";

    it("Test 1 - function", function () {
        expect(tangelo.isFunction(tangelo.isFunction))
            .toBe(true);
    });

    it("Test 2 - number", function () {
        expect(tangelo.isFunction(42))
            .toBe(false);
    });

    it("Test 3 - null", function () {
        expect(tangelo.isFunction(null))
            .toBe(false);
    });

    it("Test 4 - blank argument list", function () {
        expect(tangelo.isFunction())
            .toBe(false);
    });
});
