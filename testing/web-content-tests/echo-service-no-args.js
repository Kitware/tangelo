declareTest({
    name: "echo test service, no arguments - correctness",
    url: "http://localhost:8080/service/test/echo",
    test: function (page) {
        var expected = "(No arguments passed)";

        console.log("expected: " + expected);
        console.log("received: " + page.plainText);

        return page.plainText === expected;
    }
});
