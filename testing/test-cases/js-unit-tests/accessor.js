/*globals describe, it, expect, tangelo */

describe("tangelo.accessor", function () {
    "use strict";

    var data = {
        oranges: "tangelos",
        lemons: {
            car: "jalopy",
            fruit: "citrus"
        }
    },
    undef1 = tangelo.accessor(),
    undef2 = tangelo.accessor({}),
    func = tangelo.accessor(function (x, y) {
        return x + y;
    }),
    value = tangelo.accessor({value: 10}),
    index = tangelo.accessor({index: true}),
    field1 = tangelo.accessor({field: "oranges"}),
    field2 = tangelo.accessor({field: "lemons.car"});

    it("Undefined accessors display 'undefined' property", function () {
        expect(undef1.undefined).toBe(true);
        expect(undef2.undefined).toBe(true);
    });

    it("Undefined accessor throws exception when called", function () {
        expect(undef1).toThrow();
        expect(undef2).toThrow();
    });

    it("Defined accessors do not display 'undefined' property", function () {
        expect(func.undefined).toBe(undefined);
        expect(value.undefined).toBe(undefined);
        expect(index.undefined).toBe(undefined);
        expect(field1.undefined).toBe(undefined);
        expect(field2.undefined).toBe(undefined);
    });

    it("Regular functions are accessors", function () {
        expect(func(3, 4)).toBe(7);
    });

    it("Value spec produces accessor", function () {
        expect(value(data)).toBe(10);
    });

    it("Index spec produces accessor", function () {
        expect(index(data, 5)).toBe(5);
    });

    it("Field spec produces accessor", function () {
        expect(field1(data)).toBe("tangelos");
        expect(field2(data)).toBe("jalopy");
    });

    it("Unknown spec throws exception", function () {
        expect(function () {
            return tangelo.accessor({invalid: "quux"});
        }).toThrow();
    });
});
