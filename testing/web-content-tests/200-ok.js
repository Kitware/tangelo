declareTest({
    name: "200 - existing page should return a 200 OK message",
    url: "/",
    test: function (page) {
        console.log("expected status code: 200");
        console.log("received status code: " + status);

        return status === "200";
    }
});
