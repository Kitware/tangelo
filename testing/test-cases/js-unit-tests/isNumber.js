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

    it("Test 4 - strings of numbers are not numbers", function () {
        expect(tangelo.isNumber("42"))
            .toBe(false);
    });

    it("Test 5 - strings of numbers cast to numbers (with +) are numbers", function () {
        expect(tangelo.isNumber(+"42"))
            .toBe(true);
    });

    it("Test 6 - empty strings are not numbers", function () {
        expect(tangelo.isNumber(""))
            .toBe(false);
    });

    it("Test 7 - floating point numbers are numbers", function () {
        expect(tangelo.isNumber(3.14159))
            .toBe(true);
    });

    it("Test 8 - Infinity is a number", function () {
        expect(tangelo.isNumber(Infinity))
            .toBe(true);
    });

    it("Test 9 - NaN is a number", function () {
        expect(tangelo.isNumber(0./0.))
            .toBe(true);
    });

    it("Test 10 - undefined (blank argument list) is not a number", function () {
        expect(tangelo.isNumber())
            .toBe(false);
    });

    it("Test 11 - objects are not numbers", function () {
        expect(tangelo.isNumber({foo: 42}))
            .toBe(false);
    });

    it("Test 12 - arrays are not numbers", function () {
        expect(tangelo.isNumber([1, 2, 3]))
            .toBe(false);
    });

    it("Test 13 - functions are not numbers", function () {
        expect(tangelo.isNumber(tangelo.isNumber))
            .toBe(false);
    });
});
