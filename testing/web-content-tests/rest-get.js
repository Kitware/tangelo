/*jslint browser: true */
/*globals declareTest, compareImages, toImageData */

declareTest({
    name: "restful test service, GET - correctness",
    url: "/service/test/restful/one/two/three?foo=bar&that=telling",
    test: function () {
        "use strict";

        var expected = "GET: one two three {'foo': u'bar', 'that': u'telling'}",
            actual = document.body.textContent;

        console.log("expected: " + expected);
        console.log("received: " + actual);

        return actual === expected;
    },
    method: "GET"
});
