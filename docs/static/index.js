window.onload = function () {
    d3.json("barchart.json", function (spec) {
        vg.parse.spec(spec, function (chart) {
            chart({
                el: "#chart"
            }).update();
        });
    });
};
