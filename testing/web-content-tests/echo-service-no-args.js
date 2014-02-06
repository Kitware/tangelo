suite({
    name: "echo test service, no arguments",
    url: "http://localhost:8080/service/test/echo",
    test_suite: function () {
        test("correctness", function (page) {
            var expected = "(No arguments passed)";

            console.log("expected: " + expected);
            console.log("received: " + page.plainText);

            return page.plainText === expected;
        });
    }
});
