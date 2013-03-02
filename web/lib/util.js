/*jslint */

/*global xdw */

/** 
 *
 * @fileOverview Provides generic utilities.
 */

(function () {
    "use strict";

    var mod;

    /**
     *
     * @name util
     *
     * @memberOf xdw
     *
     * @namespace General utilities cutting across several application needs.
     */
    mod = xdw.namespace("util");

    mod.drawer_size = function () {
        return 23;
    };

    mod.drawer_toggle = function (divsel, buttonsel) {
        var div,
            button,
            state,
            divheight,
            iconheight;

        // Use the selectors to grab the DOM elements.
        div = d3.select(divsel);
        button = d3.select(buttonsel);

        // Initially, the panel is open.
        state = 'uncollapsed'

        // Save the original height of the panel.
        //
        // TODO(choudhury): when the panel is collapsed and then uncollapsed, it
        // is too short for some reason.  Adding 40 pixels makes things so all
        // the panel content can be seen, but it would be better to figure out
        // why this happens.
        divheight = +div.style("height").slice(0,-2) + 40 + "px";
        console.log(divheight);

        // The glyphicon halfings are around 22.875 pixels tall.
        iconheight = mod.drawer_size() + "px";

        // This function, when called, will toggle the state of the panel.
        return function () {
            if(state === 'uncollapsed'){
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
    };
}())
