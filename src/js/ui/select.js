/*jslint browser: true */

(function (tangelo, d3, $) {
    "use strict";

    tangelo.ui.select = function (spec, root, data) {
        var select = root.append("select"),
            d = data[spec.data],
            numeric;

        spec.label = spec.label || d.key;

        numeric = tangelo.isNumber(d.active);

        select.selectAll("option")
            .data(d.value)
            .enter().append("option")
            .attr("value", function (dd) { return dd[d.key]; })
            .text(function (dd) { return dd[spec.label]; });
        $(select.node()).val(d.active);
        $(select.node()).change(function () {
            d.active = $(this).val();
            if (numeric) {
                d.active = +d.active;
            }
            if (spec.app) {
                spec.app.reset();
            }
        });
    };

}(window.tangelo, window.d3, window.$));