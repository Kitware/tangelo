/*jslint browser: true, nomen: true */

(function ($, tangelo, d3) {
    "use strict";

    $.fn.options = function (spec) {
        var select = d3.select(this[0]).append("select"),
            id = tangelo.accessor(spec.id, ""),
            label = spec.label ? tangelo.accessor(spec.label, "") : id,
            data = spec.data,
            value = spec.value;

        select.selectAll("option")
            .data(data)
            .enter().append("option")
            .attr("value", function (d) { return id(d); })
            .text(function (d) { return label(d); });

        if (value !== undefined) {
            select.node().value = value;
        }

        if (spec.on && spec.on.change) {
            select.on("change", function () {
                spec.on.change(this.options[this.selectedIndex].__data__);
            });
        }
    };

}(window.jQuery, window.tangelo, window.d3));
