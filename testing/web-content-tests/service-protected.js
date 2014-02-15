/*jslint browser: true */
/*globals declareTest, compareImages, toImageData */

declareTest({
    name: "service source code should be forbidden",
    url: "/service/test/configured.py",
    test: function (page, info) {
        "use strict";

        console.log("expected status code: 403");
        console.log("received status code: " + info.status);

        return info.status === 403;
    }
});
