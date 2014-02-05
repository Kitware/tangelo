suite("404", "http://localhost:8080/doesntexist", function () {
    test("nonexistent page should return a 404 error", function (page) {
        console.log("expected status code: 404");
        console.log("received status code: " + status);

        return status === "404";
    });
});
