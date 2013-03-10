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

    mod.svgColorLegend = function (legend, cmap_func, xoffset, yoffset, categories, height_padding, width_padding, text_spacing, legend_margins) {
        var bbox,
            bg,
            bottom,
            height,
            heightfunc,
            left,
            maxheight,
            maxwidth,
            right,
            text,
            top,
            totalheight,
            totalwidth,
            width;

        maxwidth = 0;
        maxheight = 0;

        // Place a rect that will serve as a container/background for the legend
        // list items.  Leave its dimensions undefined for now (they will be
        // computed from the size of all the elements later).
        bg = legend.append("rect")
            //.style("fill", "gray");
            .style("fill", "white")
            .style("opacity", 0.7);

        $.each(categories, function (i, d) {
            legend.append("rect")
            .classed("colorbox", true)
            .attr("x", xoffset)
            // "y", "width", and "height" intentionally left unset
            .style("fill", cmap_func(d));

        text = legend.append("text")
            .classed("legendtext", true)
            // "x" and "y" intentionally left unset
            .text(d);

        // Compute the max height and width out of all the text bgs.
        bbox = text[0][0].getBBox();

        if (bbox.width > maxwidth) {
            maxwidth = bbox.width;
        }

        if (bbox.height > maxheight) {
            maxheight = bbox.height;
        }
        });

        // Compute the height and width of each color swatch.
        height = maxheight + height_padding;
        width = height;

        // Compute the total height and width of all the legend items together.
        totalheight = height * categories.length;
        totalwidth = width + width_padding + maxwidth;

        // Get the user-supplied margin values.
        left = legend_margins.left || 0;
        top = legend_margins.top || 0;
        right = legend_margins.right || 0;
        bottom = legend_margins.bottom || 0;

        // Set the dimensions of the container rect, based on the height/width of
        // all the items, plus the user supplied margins.
        bg.attr("x", xoffset - left || 0)
            .attr("y", yoffset - top || 0)
            .attr("width", left + totalwidth + right)
            .attr("height", top + totalheight + bottom);

        heightfunc = function (d, i) {
            return yoffset + i * height;
        };

        legend.selectAll(".colorbox")
            .attr("width", height)
            .attr("height", height)
            .attr("y", heightfunc);

        legend.selectAll(".legendtext")
            .attr("x", xoffset + width + width_padding)
            .attr("y", function (d, i) {
                //return 19 + heightfunc(d, i);
                return text_spacing + heightfunc(d, i);
            });
    };
}())
