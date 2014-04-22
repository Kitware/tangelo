/*jslint browser: true */
/*globals declareTest, compareImages, toImageData, $ */

declareTest({
    name: "Geodots - ground truth match",
    url: "/examples/geodots",
    imageFile: "${CMAKE_BINARY_DIR}/tangelo/web/examples/geodots/geodots.png",
    test: function (page, info) {
        "use strict";

        var screencap,
            ground;

        screencap = page.evaluate(function () {
            var canvas = $("canvas")[0],
                b64 = canvas.toDataURL().split(",")[1];

            return b64;
        });

        ground = info.imageData;

        return compareImages(screencap, ground);
    }
});
