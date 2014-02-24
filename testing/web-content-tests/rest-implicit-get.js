/*jslint browser: true */
/*globals declareTest, compareImages, toImageData */

declareTest({
    name: "restful test service, implicit GET - correctness",
    url: "/service/test/restful/one/two/three?foo=bar&that=telling",
    test: function (page) {
        "use strict";

        var expected = "GET: one two three {'foo': u'bar', 'that': u'telling'}";

        console.log("expected: " + expected);
        console.log("received: " + page.plainText);

        return page.plainText === expected;
    }
});
