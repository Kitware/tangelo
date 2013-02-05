/*jslint browser: true */

/*globals d3 */

// A bar chart object.

// Global namespace for this file.
var barchart = {};

barchart.barchart = function (options) {
    "use strict";

    var table,
        xcolumn,
        ycolumn,
        svgselector,
        position,
        size,
        yrange,
        margins,
        border,
        background,
        required,
        missing,
        i,
        id,
        margin,
        w,
        h,
        g,
        yscale,
        gap_proportion,
        xscale,
        barwidth,
        yAxis,
        xAxis;

    // Extract options.
    //
    // TODO(choudhury): add parameters for background color/opacity and whether
    // to place a border around the chart.
    table = options.table;
    xcolumn = options.xcolumn;
    ycolumn = options.ycolumn;
    svgselector = options.svgselector;
    position = options.position || [0, 0];
    size = options.size;
    yrange = options.yrange;
    margins = options.margins;
    border = options.border;
    background = null;

    // Raise exception for missing required options.
    required = ["table", "xcolumn", "ycolumn", "svgselector", "size", "yrange"];
    missing = [];
    for (i = 0; i < required.length; i += 1) {
        if (typeof options[required[i]] === 'undefined') {
            missing.push(required[i]);
        }
    }
    if (missing.length > 0) {
        throw ("error [barchart]: the following options are REQUIRED: " + missing.join(", "));
    }

    // Create a unique DOM ID for the svg grouper.
    id = ID.next();

    // Create a margin (use this to style the placement of the chart elements
    // properly).
    margin = {
        left: 35,
        right: 10,
        top: 10,
        bottom: 25
    };

    // Remove the margins from the sizing parameter.
    w = size[0] - margin.left - margin.right;
    h = size[1] - margin.top - margin.bottom;

    // Create a group that will hold everything for the chart.
    g = d3.select(svgselector).append("g")
        .attr("id", id);

    // Apply a translation.
    g.attr("transform", "translate(" + (position[0] + margin.left) + "," + (position[1] + margin.top) + ")");

    // TODO(choudhury): style this according to input params.
    if (border) {
        g.append("rect")
            .style("fill", "white")
            .style("fill-opacity", 0.0)
            .style("stroke", "black")
            .style("stroke-width", "2px")
            .style("stroke-opacity", 1.0)
            .attr("width", w)
            .attr("height", h);
    }

    // Use a continuous scale for the y-axis, mapping from the data range to the
    // pixel range (invert the mapping to account for SVG's coordinate system).
    yscale = d3.scale.linear()
        .domain(yrange)
        .range([h, 0]);

    // The gaps between bars will be 20% of the width of the bars themselves.
    gap_proportion = 0.2;

    // Create an ordinal scale for horizontal placement of the bars.
    xscale = d3.scale.ordinal()
        .domain(table.map(function (d) { return d[xcolumn]; }))
        .rangeRoundBands([0, w], gap_proportion);

    // Compute the width of the bar.
    barwidth = w * (1 - gap_proportion) / xscale.domain().length;

    g.selectAll("rect.bar")
        .data(table)
        .enter()
        .append("rect")
        .classed("bar", true)
        .style("fill", "darkgreen")
        .attr("x", function (d) { return xscale(d[xcolumn]); })
        .attr("y", h)
        .attr("width", barwidth)
        .attr("height", 0.0)
        .transition()
        .delay(function (d, i) { return i * 50; })
        .duration(300)
        .attr("y", function (d) { return yscale(d[ycolumn]); })
        .attr("height", function (d) { return h - yscale(d[ycolumn]); });

    g.selectAll("rect.bar")
        .append("title").text(function (d) { return d[ycolumn]; });

    // TODO(choudhury): Place axes (style properly).
    yAxis = d3.svg.axis()
        .scale(yscale)
        .orient("left")
        .ticks(1);

    g.append("g")
        .classed("y", true)
        .classed("axis", true)
        .call(yAxis);

    xAxis = d3.svg.axis()
        .scale(xscale)
        .orient("bottom")
        .ticks(xscale.domain().length);

    g.append("g")
        .classed("x", true)
        .classed("axis", true)
        .attr("transform", "translate(0," + h + ")")
        .call(xAxis);

    return null;
};
