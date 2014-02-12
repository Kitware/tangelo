declareTest({
    name: "Geodots - ground truth match",
    url: "/examples/geodots",
    imageFile: "${CMAKE_BINARY_DIR}/tangelo/web/examples/geodots/geodots.png",
    test: function (page) {
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

        ground = imageData;

        return compareImages(screencap, ground);
    }
});
