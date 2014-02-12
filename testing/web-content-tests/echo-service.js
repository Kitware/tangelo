/*jslint browser: true */
/*globals declareTest, compareImages, toImageData */

declareTest({
    name: "echo test service - correctness",
    url: "/service/test/echo/oct/30?color=green&answer=42",
    test: function (page) {
        "use strict";

        var expected = "[oct, 30]\ncolor -> green\nanswer -> 42";

        console.log("expected: " + expected);
        console.log("received: " + page.plainText);

        return page.plainText === expected;
    }
});
