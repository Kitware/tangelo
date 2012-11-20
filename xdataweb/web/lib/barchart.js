// A bar chart object.

// Global namespace for this file.
var barchart = {};

//barchart.barchart = function(table, xcolumn, ycolumn, svgselector, translate){
barchart.barchart = function(options){
    // Extract options.
    var table = options.table;
    var xcolumn = options.xcolumn;
    var ycolumn = options.ycolumn;
    var svgselector = options.svgselector;
    var position = options.position;
    var size = options.size;

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
