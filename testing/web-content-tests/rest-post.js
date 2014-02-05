suite("restful test service, POST", "http://localhost:8080/service/test/restful/one/two/three?foo=bar&that=telling", function () {
    test("correctness", function (page) {
        var expected = "POST: one two three {'foo': u'bar', 'that': u'telling'}";

        console.log("expected: " + expected);
        console.log("received: " + page.plainText);

        return page.plainText === expected;
    });
}, "POST", {
    foo: "bar",
    that: "telling"
});
