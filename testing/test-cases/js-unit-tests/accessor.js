/*globals describe, it, expect, tangelo */

describe("tangelo.accessor", function () {
    "use strict";

    var data = {
            oranges: "tangelos",
            lemons: {
                car: "jalopy",
                fruit: "citrus"
            }
        };

    it("Undefined accessors display 'undefined' property", function () {
        var undef1 = tangelo.accessor(),
            undef2 = tangelo.accessor({});
        expect(undef1.undefined).toBe(true);
        expect(undef2.undefined).toBe(true);
    });

    it("Undefined accessor throws exception when called", function () {
        expect(tangelo.accessor()).toThrow();
        expect(tangelo.accessor({})).toThrow();
    });

    it("Defined accessors do not display 'undefined' property", function () {
        var value = tangelo.accessor({value: 10});
        expect(value.undefined).toBe(undefined);
    });

    it("Value spec produces accessor", function () {
        var value = tangelo.accessor({value: 10});
        expect(value(data)).toBe(10);
    });

    it("Index spec produces accessor", function () {
        var index = tangelo.accessor({index: true});
        expect(index(data, 5)).toBe(5);
    });

    it("Field spec produces accessor", function () {
        var field1 = tangelo.accessor({field: "oranges"}),
            field2 = tangelo.accessor({field: "lemons.car"}),
            field3 = tangelo.accessor({field: "."});
        expect(field1(data)).toBe("tangelos");
        expect(field2(data)).toBe("jalopy");
        expect(field2({})).toBe(undefined);
        expect(field3(4)).toBe(4);
    });

    it("Unknown spec throws exception", function () {
        expect(function () {
            return tangelo.accessor({invalid: "quux"});
        }).toThrow();
        expect(tangelo.accessor(undefined)).toThrow();
    });

    it("Clone a function (twice)", function () {
        expect(tangelo.accessor(tangelo.accessor(function (d) { return d; }))(10)).toBe(10);
    });
});
