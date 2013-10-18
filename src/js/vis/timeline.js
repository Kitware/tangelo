/*jslint browser: true, unparam: true */

(function (tangelo, vg) {
    "use strict";

    tangelo.vis.timeline = function (spec) {
        var y,
            date = tangelo.accessor(spec.date, undefined),
            data = spec.data,
            dt = [],
            opt = {
                data: {table: dt},
                renderer: "svg",
                el: this
            },
            that = this;

        spec.y = tangelo.isArray(spec.y) ? spec.y : [spec.y];
        y = [];
        spec.y.forEach(function (d) {
            y.push(tangelo.accessor(d, 0));
        });
        d.forEach(function (d) {
            var ty = tangelo.isArray(y) ? y : [y];
            ty.forEach(function (yy) {
                dt.push({
                    date: row[date],
                    group: yy,
                    y: row[yy],
                    orig: row
                });
            });
        });
        vg.parse.spec("/vega/timeline.json", function(chart) {
            chart(opt)
                .on("mouseover", function (event, d) {
                    if (on.mouseover) {
                        on.mouseover(d);
                    }
                })
                .on("mouseout", function (event, d) {
                    if (on.mouseout) {
                        on.mouseout(d);
                    }
                })
                .on("click", function (event, d) {
                    if (on.click) {
                        on.click(d);
                    }
                })
                .update();
        });

        function update() {
            return that;
        }

        that.update = update;
        return that;
    };

}(window.tangelo, window.vg));