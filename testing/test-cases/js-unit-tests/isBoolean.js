/*globals describe, it, expect, tangelo */

describe("isBoolean()", function () {
    "use strict";

    it("Test 1 - 'true' is a boolean", function () {
        expect(tangelo.isBoolean(true))
            .toBe(true);
    });

    it("Test 2 - 'false' is a boolean", function () {
        expect(tangelo.isBoolean(false))
            .toBe(true);
    });

    it("Test 2 - numbers are not boolean", function () {
        expect(tangelo.isBoolean(450))
            .toBe(false);
    });
});
