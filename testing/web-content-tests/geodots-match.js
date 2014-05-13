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

        var screencap,
            screenCanvas,
            ground;

        screenCanvas = $("canvas").get(0);
        screencap = new CanvasImage();
        screencap.drawFromElement(screenCanvas);
        //screencap.savePNG("roni.png");

        //ground = info.imageData;

        //return compareImages(screencap, ground);
        //return L2(diffImage(screencap, info.baseline)) < info.threshold;
        return false;
    }
});
