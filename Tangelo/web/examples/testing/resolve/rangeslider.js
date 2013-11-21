/*jslint browser: true, unparam: true */

(function (tangelo, d3, $) {
    "use strict";

    tangelo.ui.rangeslider = function (spec) {
        var low, high, main, values, el, that = {}, dateformat = d3.time.format("%b %a, %Y (%H:%M:%S)";

        el = d3.select(spec.el)
            .style("padding", "0px 20px 10px 20px");
        if (spec.heading) {
            el.append("h4").text(spec.heading);
        }
        main = $(el.append("div").node());
        low = el.append("code");
        high = el.append("code");

        values = [spec.value.min, spec.value.max];

        function displayFunc(values) {
            if (spec.date) {
                low.html(dateformat(new Date(values[0])));
                high.html(dateformat(new Date(values[1])));
            } else {
                low.html(values[0]);
                high.html(values[1]);
            }
        }

        main.dragslider({
            range: true,
            rangeDrag: true,

            min: spec.range.min,
            max: spec.range.max,
            values: values,

            change: function (evt, ui) {
                displayFunc(ui.values);
                if (spec.on && spec.on.change) {
                    spec.on.change({min: ui.values[0], max: ui.values[1]});
                }
            },

            slide: function (evt, ui) {
                displayFunc(ui.values);
            }
        });
        displayFunc(values);

        that.update = function (updatedSpec) {
            return that;
        };

        return that;
    };

}(window.tangelo, window.d3, window.$));
