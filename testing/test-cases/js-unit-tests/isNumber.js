/*globals describe, it, expect, tangelo */

describe("isNumber()", function () {
    "use strict";

    it("Test 1 - boolean should not be a number", function () {
        expect(tangelo.isNumber(true))
            .toBe(false);
    });

    it("Test 2 - '35' is a number", function () {
        expect(tangelo.isNumber(35))
            .toBe(true);
    });

    it("Test 3 - strings are not numbers", function () {
        expect(tangelo.isNumber("not a number"))
            .toBe(false);
    });

    it("Test 4 - strings of numbers are not strings", function () {
        expect(tangelo.isNumber("42"))
            .toBe(false);
    });

    it("Test 5 - strings of numbers (with +) are not strings", function () {
        expect(tangelo.isNumber("+42"))
            .toBe(true);
    });

    it("Test 6 - empty strings are not numbers", function () {
        expect(tangelo.isNumber(""))
            .toBe(false);
    });

});
