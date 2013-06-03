/*jslint browser: true */

/*globals jQuery, d3 */

(function ($) {
    $.fn.controlPanel = function () {
        var toggle,
            s;

        // Make a d3 selection out of the target element.
        s = d3.select(this[0]);

        // Bail out silently if the selection is empty.
        if (s.empty()) {
            return;
        }

        // Style the control panel div appropriately, then add a div as the
        // first child to act as the drawer handle (and place an appropriate
        // icon in the middle of it).
        s.attr("id", "tangelo-control-panel")
            .classed("control-panel", true)
            .insert("div", ":first-child")
                .attr("id", "tangelo-drawer-handle")
                .classed("centered", true)
                .classed("pointer", true)
                .classed("drawer", true)
                .append("i")
                    .attr("id", "tangelo-drawer-icon")
                    .classed("icon-chevron-down", true);

        toggle = tangelo.util.drawer_toggle("#tangelo-control-panel", "#tangelo-drawer-icon");
        d3.select("#tangelo-drawer-handle")
            .on("click", toggle);
    };
}(jQuery));
