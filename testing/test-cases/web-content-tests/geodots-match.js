/*jslint browser: true */
/*globals declareTest, compareImages */

declareTest({
    name: "Geodots - ground truth match",
    url: "/examples/geodots",
    imageFiles: {
        geodots: "${CMAKE_BINARY_DIR}/tangelo/web/examples/geodots/geodots.png"
    },
    test: function () {
        "use strict";

        return compareImages({
            testElement: document.getElementsByTagName("canvas")[0],
            baselineName: "geodots",
            filenameBase: "geodots",
            percentThreshold: 0.05
        });
    }
});
