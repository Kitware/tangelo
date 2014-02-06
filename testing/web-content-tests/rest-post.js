declareTest({
    name: "restful test service, POST - correctness",
    url: "http://localhost:8080/service/test/restful/one/two/three?foo=bar&that=telling",
    test: function (page) {
        var expected = "POST: one two three {'foo': u'bar', 'that': u'telling'}";

        console.log("expected: " + expected);
        console.log("received: " + page.plainText);

        return page.plainText === expected;
    },
    method: "POST",
    data: {
        foo: "bar",
        that: "telling"
    }
});
