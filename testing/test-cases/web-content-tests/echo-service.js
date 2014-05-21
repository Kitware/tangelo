/*jslint browser: true */
/*globals declareTest, compareImages, toImageData */

declareTest({
    name: "echo test service - correctness",
    url: "/service/test/echo/oct/30?color=green&answer=42",
    test: function () {
        "use strict";

        var expected = "[oct, 30]\ncolor -> green\nanswer -> 42",
            actual = document.body.textContent;

        console.log("expected: " + expected);
        console.log("received: " + actual);

        return actual === expected;
    }
});
