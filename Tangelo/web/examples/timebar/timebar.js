/*jslint browser: true, unparam: true */

(function ($, tangelo, vg) {
    "use strict";

    $.fn.timebar = tangelo.vis.timebar = function (spec) {
        var color = tangelo.accessor(spec.color, "steelblue"),
            date = tangelo.accessor(spec.date, undefined),
            dt = [],
            opt = {
                data: {table: dt},
                renderer: "svg",
                el: this[0]
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
        vg.parse.spec("timebar.json", function(chart) {
            chart(opt).update();
        });

        function update() {
            return that;
        }

        that.update = update;
        return that;
    };
}(window.jQuery, window.tangelo, window.vg));
