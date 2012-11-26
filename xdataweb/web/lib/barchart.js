// A bar chart object.

// Global namespace for this file.
var barchart = {};

//barchart.barchart = function(table, xcolumn, ycolumn, svgselector, translate){
barchart.barchart = function(options){
    // Extract options.
    //
    // TODO(choudhury): add parameters for background color/opacity and whether
    // to place a border around the chart.
    var table = options.table;
    var xcolumn = options.xcolumn;
    var ycolumn = options.ycolumn;
    var svgselector = options.svgselector;
    var position = options.position || [0,0];
    var size = options.size;
    var yrange = options.yrange;
    var margins = options.margins;
    var border = options.border;
    var background = null;

    // Raise exception for missing required options.
    required = ["table", "xcolumn", "ycolumn", "svgselector", "size", "yrange"];
    missing = [];
    for(var i=0; i<required.length; i++){
        if(typeof options[required[i]] === 'undefined'){
            missing.push(required[i]);
        }
    }
    if(missing.length > 0){
        throw("error [barchart]: the following options are REQUIRED: " + missing.join(", "));
    }

    // Create a unique DOM ID for the svg grouper.
    var id = ID.next();

    // Create a margin (use this to style the placement of the chart elements
    // properly).
    var margin = {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10
    };

    // Remove the margins from the sizing parameter.
    var w = size[0] - margin.left - margin.right;
    var h = size[1] - margin.top - margin.bottom;

    // Create a group that will hold everything for the chart.
    var g = d3.select(svgselector).append("g")
        .attr("id", id);

    // Apply a translation.
    g.attr("transform", "translate(" + (position[0] + margin.left) + "," + (position[1] + margin.top) + ")");

    // TODO(choudhury): style this according to input params.
    if(border){
        g.append("rect")
            .style("fill", "white")
            .style("fill-opacity", 0.0)
            .style("stroke", "black")
            .style("stroke-width", "2px")
            .style("stroke-opacity", 1.0)
            .attr("width", w)
            .attr("height", h);
    }

    // Compute bar and gap widths.
    //
    // TODO(choudhury): make the proportion of bar width to be used for the gap
    // into a parameter.
    var barwidth = w / table.length;
    var gap = barwidth*0.20;
    barwidth = barwidth*0.80;

    console.log(table);

    var yscale = d3.scale.linear()
        .domain(yrange)
        .range([0,h]);

    g.selectAll("rect.bar")
        .data(table)
        .enter()
        .append("rect")
        .classed("bar", true)
        .style("fill", "darkgreen")
        .attr("x", function(d, i) { return 0.5*gap + i*(barwidth+gap); })
        .attr("y", h)
        .attr("width", barwidth)
        .attr("height", 0.0)
        .transition()
        .delay(function(d,i) { return i*50; })
        .duration(300)
        .attr("y", function(d) { return h - yscale(d[ycolumn]); })
        .attr("height", function(d) { return yscale(d[ycolumn]); });

    g.selectAll("rect.bar")
        .append("title").text(function(d) { return d[ycolumn]; });

    // TODO(choudhury): Place axes (style properly).
    var yAxis = d3.svg.axis()
        .scale(yscale)
        .orient("left")
        .ticks(1);

    g.append("g")
        .call(yAxis);

/*    return {*/
        
    /*};*/
    return null;
}
