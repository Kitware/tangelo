suite({
    name: "Geodots",
    url: "http://localhost:8080/examples/geodots",
    image_file: "${CMAKE_BINARY_DIR}/tangelo/web/examples/geodots/geodots.png",
    test_suite: function () {
        test("ground truth match", function (page) {
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

            ground = image_data;

/*            ground.then(function (result) {*/
                //console.log(JSON.stringify(result));
            //});

/*            diff = computeImageDiff(screencap, ground);*/

            //console.log("image difference: " + diff);
            //console.log("match threshold: " + threshold);

            //return diff <= threshold;

            //return ground;
            return compareImages(screencap, ground);
        });
    }
});
