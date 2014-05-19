/*jslint browser: true */
/*globals declareTest, info */

declareTest({
    name: "200 - existing page should return a 200 OK message",
    url: "/",
    test: function () {
        "use strict";

        console.log("expected status code: 200");
        console.log("received status code: " + info.status);

        return info.status === 200;
    }
});
