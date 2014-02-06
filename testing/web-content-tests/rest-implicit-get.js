suite({
    name: "restful test service, implicit GET",
    url: "http://localhost:8080/service/test/restful/one/two/three?foo=bar&that=telling",
    test_suite: function () {
        test("correctness", function (page) {
            var expected = "GET: one two three {'foo': u'bar', 'that': u'telling'}";

            console.log("expected: " + expected);
            console.log("received: " + page.plainText);

            return page.plainText === expected;
        });
    }
});
