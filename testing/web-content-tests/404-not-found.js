declareTest({
    name: "404 - nonexistent page should return a 404 error",
    url: "http://localhost:8080/doesntexist",
    test: function (page) {
        console.log("expected status code: 404");
        console.log("received status code: " + status);

        return status === "404";
    }
});
