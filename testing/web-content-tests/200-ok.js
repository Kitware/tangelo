declareTest({
    name: "200 - existing page should return a 200 OK message",
    url: "/",
    test: function (page, info) {
        console.log(JSON.stringify(info));

        console.log("expected status code: 200");
        console.log("received status code: " + info.status);

        return info.status === 200;
    }
});
