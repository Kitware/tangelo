suite({
    name: "200",
    url: "http://localhost:8080/",
    test_suite: function () {
        test("existing page should return a 200 OK message", function (page) {
            console.log("expected status code: 200");
            console.log("received status code: " + status);

            return status === "200";
        })
    }
});
