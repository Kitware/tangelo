/*jslint browser: true */
/*globals declareTest, compareImages, toImageData, $ */

declareTest({
    name: "Geodots - ground truth match",
    url: "/examples/geodots",
    imageFiles: {
        geodots: "${CMAKE_BINARY_DIR}/tangelo/web/examples/geodots/geodots.png"
    },
    test: function (info) {
        "use strict";

        return compareImages(document.getElementsByTagName("canvas")[0], "geodots", "geodots", 1e-8);
    }
});
