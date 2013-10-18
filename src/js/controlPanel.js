/*jslint browser: true */

/*globals jQuery, d3 */

(function ($) {
    "use strict";

    function drawerToggle(divsel, buttonsel) {
        var div,
            button,
            state,
            divheight,
            iconheight;

        // Use the selectors to grab the DOM elements.
        div = d3.select(divsel);
        button = d3.select(buttonsel);

        // Initially, the panel is open.
        state = 'uncollapsed';

        // The glyphicon halfings are around 22.875 pixels tall.
        iconheight = "23px";

        // Save the original height of the panel.
        // This requires a DOM update to do this correctly, so we wait a second.
        // I have found that waiting less than 200ms can cause undefined behavior,
        // since there may be other callback that need to populate the panel.
        function updateHeight() {
            divheight = $(div.node()).height() + "px";
        }
        window.setTimeout(updateHeight, 1000);

        // This function, when called, will toggle the state of the panel.
        return function () {
            if (state === 'uncollapsed') {
                div.transition()
                    .duration(500)
                    .style("height", iconheight);

                button.classed("icon-chevron-down", false)
                    .classed("icon-chevron-up", true);

                state = 'collapsed';
            } else if (state === 'collapsed') {
                div.transition()
                    .duration(500)
                    .style("height", divheight);

                button.classed("icon-chevron-down", true)
                    .classed("icon-chevron-up", false);

                state = 'uncollapsed';
            } else {
                throw "Illegal state: " + state;
            }
        };
    }

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

        toggle = drawerToggle("#tangelo-control-panel", "#tangelo-drawer-icon");
        d3.select("#tangelo-drawer-handle")
            .on("click", toggle);
    };
}(jQuery));
