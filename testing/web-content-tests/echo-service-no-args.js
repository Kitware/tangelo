/*jslint browser: true */
/*globals declareTest, compareImages, toImageData */

declareTest({
    name: "echo test service, no arguments - correctness",
    url: "/service/test/echo",
    test: function (page) {
        "use strict";

        var expected = "(No arguments passed)";

        console.log("expected: " + expected);
        console.log("received: " + page.plainText);

        return page.plainText === expected;
    }
});
