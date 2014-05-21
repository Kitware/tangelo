/*jslint browser: true */
/*globals declareTest */

declareTest({
    name: "restful test service, POST - correctness",
    url: "/service/test/restful/one/two/three?foo=bar&that=telling",
    test: function () {
        "use strict";

        var expected = "POST: one two three {'foo': u'bar', 'that': u'telling'}",
            actual = document.body.textContent;

        console.log("expected: " + expected);
        console.log("received: " + actual);

        return actual === expected;
    },
    method: "POST",
    data: {
        foo: "bar",
        that: "telling"
    }
});
