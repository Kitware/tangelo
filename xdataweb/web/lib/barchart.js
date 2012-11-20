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
    var translate = options.translate;
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
    if(typeof translate !== "undefined"){
        g.attr("transform", "translate(" + translate[0] + "," + translate[1] + ")");
    }

    g.append("circle")
        .style("fill", "green")
        .style("stroke", "black")
        .style("stroke-width", "3px")
        .attr("cx", 100)
        .attr("cy", 100)
        .attr("r", 40);

/*    return {*/
        
    /*};*/

    return null;
}
