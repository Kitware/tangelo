(function (tangelo, $, d3, _) {
    "use strict";

    function drawerToggle(divsel, buttonsel) {
        var div,
            button,
            state,
            iconheight;

        // Use the selectors to grab the DOM elements.
        div = d3.select(divsel);
        button = d3.select(buttonsel);

        // Initially, the panel is open.
        state = "uncollapsed";

        // The glyphicon halfings are around 20 pixels tall.
        iconheight = "20px";

        // Compute the "standing" height of the control panel.  This is done by
        // clearing the current height style directive, then asking what its
        // height is, then replacing the height directive.  This should not
        // result in any visible flicker.
        function getFullHeight() {
            var styleheight = div.style("height"),
                fullheight;

            div.style("height", null);
            fullheight = $(div.node()).height() + "px";
            div.style("height", styleheight);

            return fullheight;
        }

        // This function, when called, will toggle the state of the panel.
        return function () {
            if (state === "uncollapsed") {
                div.transition()
                    .duration(500)
                    .style("height", iconheight);

                button.classed("glyphicon-chevron-down", false)
                    .classed("glyphicon-chevron-up", true);

                state = "collapsed";
            } else if (state === "collapsed") {
                // This transition computes the full height of the panel, grows
                // the panel to that height, then tosses out the height style
                // directive.  This allows new, dynamic content to automatically
                // grow the element, while also allowing the smooth transition
                // effect here.
                div.transition()
                    .duration(500)
                    .style("height", getFullHeight())
                    .each("end", function () {
                        div.style("height", null);
                    });

                button.classed("glyphicon-chevron-down", true)
                    .classed("glyphicon-chevron-up", false);

                state = "uncollapsed";
            } else {
                throw new Error("illegal state: " + state);
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
        tag = _.uniqueId();
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
}(window.tangelo, window.jQuery, window.d3, window._));
