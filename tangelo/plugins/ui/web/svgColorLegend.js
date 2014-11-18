(function ($, d3) {
    "use strict";

    $.fn.svgColorLegend = function (cfg) {
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
            width,
            legend,
            cmapFunc,
            xoffset,
            yoffset,
            categories,
            heightPadding,
            widthPadding,
            textSpacing,
            legendMargins,
            clear;

        // Extract arguments from the config argument.
        cmapFunc = cfg.cmapFunc;
        xoffset = cfg.xoffset;
        yoffset = cfg.yoffset;
        categories = cfg.categories;
        heightPadding = cfg.heightPadding;
        widthPadding = cfg.widthPadding;
        textSpacing = cfg.textSpacing;
        legendMargins = cfg.legendMargins;
        clear = cfg.clear;

        // Create a d3 selection from the selection.
        legend = d3.select(this[0]);

        // Clear the svg element, if requested.
        clear = clear || false;
        if (clear) {
            legend.selectAll("*").remove();
        }

        maxwidth = 0;
        maxheight = 0;

        // Place a rect that will serve as a container/background for the legend
        // list items.  Leave its dimensions undefined for now (they will be
        // computed from the size of all the elements later).
        bg = legend.append("rect")
            .style("fill", "white")
            .style("opacity", 0.7);

        /*jslint unparam: true */
        $.each(categories, function (i, d) {
            legend.append("rect")
                .classed("colorbox", true)
                .attr("x", xoffset)
                // "y", "width", and "height" intentionally left unset
                .style("fill", cmapFunc(d));

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
        /*jslint unparam: false */

        // Compute the height and width of each color swatch.
        height = maxheight + heightPadding;
        width = height;

        // Compute the total height and width of all the legend items together.
        totalheight = height * categories.length;
        totalwidth = width + widthPadding + maxwidth;

        // Get the user-supplied margin values.
        left = legendMargins.left || 0;
        top = legendMargins.top || 0;
        right = legendMargins.right || 0;
        bottom = legendMargins.bottom || 0;

        // Set the dimensions of the container rect, based on the height/width of
        // all the items, plus the user supplied margins.
        bg.attr("x", xoffset - left || 0)
            .attr("y", yoffset - top || 0)
            .attr("width", left + totalwidth + right)
            .attr("height", top + totalheight + bottom);

        /*jslint unparam: true */
        heightfunc = function (d, i) {
            return yoffset + i * height;
        };
        /*jslint unparam: false */

        legend.selectAll(".colorbox")
            .attr("width", height)
            .attr("height", height)
            .attr("y", heightfunc);

        legend.selectAll(".legendtext")
            .attr("x", xoffset + width + widthPadding)
            .attr("y", function (d, i) {
                return textSpacing + heightfunc(d, i);
            });
    };
}(window.jQuery, window.d3));
