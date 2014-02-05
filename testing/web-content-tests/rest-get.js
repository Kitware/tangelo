suite("restful test service, GET", "http://localhost:8080/service/test/restful/one/two/three?foo=bar&that=telling", function () {
    test("correctness", function (page) {
        var expected = "GET: one two three {'foo': u'bar', 'that': u'telling'}";

        console.log("expected: " + expected);
        console.log("received: " + page.plainText);

        return page.plainText === expected;
    });
}, "GET");
