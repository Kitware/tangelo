/*jslint browser: true */
/*globals declareTest, compareImages, toImageData, $ */

declareTest({
    name: "Geodots - ground truth match",
    //url: "/examples/geodots",
    url: "/examples/geonodelink",
    imageFiles: {
        geodots: "${CMAKE_BINARY_DIR}/tangelo/web/examples/geodots/geodots.png"
    },
    test: function (page, info) {
        "use strict";

        var screencap,
            screenCanvas,
            ground;

/*        screenCanvas = page.evaluate(function () {*/
            ////return $("canvas").get(0);
            //return document.getElementsByTagName("canvas")[0];
        //});

        screenCanvas = $("canvas").get(0);
        screencap = new CanvasImage();
        //screencap.loadCanvas($("canvas").get(0));
        //screencap.savePNG("roni.png");

        //ground = info.imageData;

        //return compareImages(screencap, ground);
        //return L2(diffImage(screencap, info.baseline)) < info.threshold;
        return false;
    }
});
