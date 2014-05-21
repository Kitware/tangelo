/*jslint browser: true */
/*globals declareTest, compareImages, toImageData */

declareTest({
    name: "services should have access to their configuration files",
    url: "/service/test/configured",
    test: function () {
        "use strict";

        var actual = document.body.textContent;

        console.log("expected: abracadabra");
        console.log("received: " + actual);

        return actual === "abracadabra";
    }
});
