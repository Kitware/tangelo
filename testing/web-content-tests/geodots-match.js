/*jslint browser: true */
/*globals declareTest, compareImages, toImageData, $ */

declareTest({
    name: "Geodots - ground truth match",
    url: "/examples/geodots",
    imageFile: "${CMAKE_BINARY_DIR}/tangelo/web/examples/geodots/geodots.png",
    test: function (page, info) {
        "use strict";

        var rect,
            screencap,
            ground,
            diff;

        rect = page.evaluate(function () {
            var canvas = $("canvas");
            return {
                top: canvas.offset().top,
                left: canvas.offset().left,
                width: canvas.width(),
                height: canvas.height()
            };
        });

        page.clipRect = rect;
        screencap = page.renderBase64("png");

        ground = info.imageData;

        return compareImages(screencap, ground);
    }
});
