/*jslint browser: true */
/*globals declareTest, compareImages, toImageData */

declareTest({
    name: "echo test service, no arguments - correctness",
    url: "/service/test/echo",
    test: function () {
        "use strict";

        var expected = "(No arguments passed)",
            actual = document.body.textContent;

        console.log("expected: " + expected);
        console.log("received: " + actual);

        return actual === expected;
    }
});
