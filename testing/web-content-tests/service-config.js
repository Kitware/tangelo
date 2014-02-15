/*jslint browser: true */
/*globals declareTest, compareImages, toImageData */

declareTest({
    name: "services should have access to their configuration files",
    url: "/service/test/configured",
    test: function (page, info) {
        "use strict";

        console.log("expected: abracadabra");
        console.log("received: " + page.plainText);

        return page.plainText === "abracadabra";
    }
});
