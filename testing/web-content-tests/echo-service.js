suite({
    name: "echo test service",
    url: "http://localhost:8080/service/test/echo/oct/30?color=green&answer=42",
    test_suite: function () {
        test("correctness", function (page) {
            var expected = "[oct, 30]\ncolor -> green\nanswer -> 42";

            console.log("expected: " + expected);
            console.log("received: " + page.plainText);

            return page.plainText === expected;
        });
    }
});
