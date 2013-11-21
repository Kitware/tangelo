/*jslint browser: true */

/*globals jQuery, d3 */

(function ($, tangelo) {
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
            s,
            id,
            tag;

        // Make a d3 selection out of the target element.
        s = d3.select(this[0]);

        // Bail out silently if the selection is empty.
        if (s.empty()) {
            return;
        }

        // Create a unique identifier to use with the various control panel
        // components.
        tag = tangelo.uniqueID();
        id = s.attr("id");
        if (!id) {
            id = "tangelo-control-panel-" + tag;
            s.attr("id", id);
        }

        // Style the control panel div appropriately, then add a div as the
        // first child to act as the drawer handle (and place an appropriate
        // icon in the mtagdle of it).
        s.style("position", "fixed")
            .style("bottom", "0px")
            .style("width", "100%")
            .style("background", "rgba(255,255,255,0.7)")
            .insert("div", ":first-child")
            .attr("id", "tangelo-drawer-handle-" + tag)
            .style("text-align", "center")
            .style("cursor", "pointer")
            .on("mouseenter", function () {
                d3.select(this)
                    .style("background", "gray");
            })
            .on("mouseleave", function () {
                d3.select(this)
                    .style("background", null);
            })
            .append("i")
            .attr("id", "tangelo-drawer-icon-" + tag)
            .classed("icon-chevron-down", true);

        toggle = drawerToggle("#" + id, "#tangelo-drawer-icon-" + tag);
        d3.select("#tangelo-drawer-handle-" + tag)
            .on("click", toggle);
    };
}(jQuery, window.tangelo));
