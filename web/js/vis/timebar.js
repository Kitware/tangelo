/*jslint browser: true, unparam: true */

(function (tangelo, vg) {
    "use strict";

    tangelo.vis.timebar = function (spec) {
        var color = tangelo.accessor(spec.color, "steelblue"),
            date = tangelo.accessor(spec.date, undefined),
            dt = [],
            opt = {
                data: {table: dt},
                renderer: "svg",
                el: spec.el
            },
            data = spec.data,
            that = {};

        data.forEach(function (d) {
            dt.push({
                date: date(d),
                color: color(d),
                orig: d
            });
        });
        vg.parse.spec("/vega/timebar.json", function(chart) {
            chart(opt).update();
        });

        function update() {
            return that;
        }

        that.update = update;
        return that;
    };
}(window.tangelo, window.vg));
