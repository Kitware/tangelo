/*globals describe, it, expect, tangelo */

describe("tangelo.accessor", function () {
    "use strict";

    it("Test accessor wrapper to a function", function () {
        var data = { x: 1, y: 2 };
        var addition = function (d) {
            return d.x + d.y;
        };
        
        var a = tangelo.accessor(addition);

        expect(a(data)).toBe(3);

    });

});
