/*jslint browser: true */

(function (tangelo, $, d3) {
    "use strict";

    if (!($ && d3)) {
        tangelo.unavailable({
            plugin: "controlPanel",
            required: ["JQuery", "d3"]
        });
        return;
    }

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

        // The glyphicon halfings are around 20 pixels tall.
        iconheight = "20px";

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

                button.classed("glyphicon-chevron-down", false)
                    .classed("glyphicon-chevron-up", true);

                state = 'collapsed';
            } else if (state === 'collapsed') {
                div.transition()
                    .duration(500)
                    .style("height", divheight);

                button.classed("glyphicon-chevron-down", true)
                    .classed("glyphicon-chevron-up", false);

                state = 'uncollapsed';
            } else {
                tangelo.fatalError("drawerToggle()", "illegal state: " + state);
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
            .append("span")
            .attr("id", "tangelo-drawer-icon-" + tag)
            .classed("glyphicon", true)
            .classed("glyphicon-chevron-down", true);

        toggle = drawerToggle("#" + id, "#tangelo-drawer-icon-" + tag);
        d3.select("#tangelo-drawer-handle-" + tag)
            .on("click", toggle);
    };
}(window.tangelo, window.jQuery, window.d3));
