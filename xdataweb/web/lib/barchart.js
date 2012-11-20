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
    var position = options.position;
    var size = options.size;
    var margins = options.margins;
    var border = null;
    var background = null;

    // Raise exception for missing required options.
    required = ["table", "xcolumn", "ycolumn", "svgselector", "size"];
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

    // Create a group that will hold everything for the chart.
    var g = d3.select(svgselector).append("g")
        .attr("id", id);

    // Apply a translation if supplied.
    if(typeof position !== "undefined"){
        g.attr("transform", "translate(" + position[0] + "," + position[1] + ")");
    }

    // TODO(choudhury): remove this, it's just for debugging.
    g.append("rect")
        .style("fill", "white")
        .style("fill-opacity", 0.0)
        .style("stroke", "black")
        .style("stroke-width", "2px")
        .style("stroke-opacity", 1.0)
        .attr("width", size[0])
        .attr("height", size[1]);

    // Compute bar and gap widths.
    //
    // TODO(choudhury): make the proportion of bar width to be used for the gap
    // into a parameter.
    var barwidth = size[0] / table.length;
    var gap = barwidth*0.20;
    barwidth = barwidth*0.80;

    // TODO(choudhury): Place axes (style properly).
    //
    // TODO(choudhury): Place bars (use y-column data, and x-column data for
    // label).
    //
    // TODO(choudhury): Grow bars from 0 height and fade them in from 0 opacity.

    // TODO(choudhury): actual barchart content goes here.
    g.append("circle")
        .style("fill", "green")
        .style("stroke", "black")
        .style("stroke-width", "3px")
        .attr("cx", size[0]/2)
        .attr("cy", size[1]/2)
        .attr("r", Math.min(size[0], size[1])/3);

/*    return {*/
        
    /*};*/

    return null;
}
