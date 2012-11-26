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

    // Create a group that will hold everything for the chart.
    var g = d3.select(svgselector).append("g")
        .attr("id", id);

    // Apply a translation if supplied.
    if(typeof position !== "undefined"){
        g.attr("transform", "translate(" + position[0] + "," + position[1] + ")");
    }

    // TODO(choudhury): style this according to input params.
    if(border){
        g.append("rect")
            .style("fill", "white")
            .style("fill-opacity", 0.0)
            .style("stroke", "black")
            .style("stroke-width", "2px")
            .style("stroke-opacity", 1.0)
            .attr("width", size[0])
            .attr("height", size[1]);
    }

    // Compute bar and gap widths.
    //
    // TODO(choudhury): make the proportion of bar width to be used for the gap
    // into a parameter.
    var barwidth = size[0] / table.length;
    var gap = barwidth*0.20;
    barwidth = barwidth*0.80;

    console.log(table);
    console.log("barwidth: " + barwidth);
    console.log("gap: " + gap);

    // TODO(choudhury): Place axes (style properly).

    var yscale = d3.scale.linear()
        .domain(yrange)
        .range([0,1]);

    g.selectAll("rect.bar")
        .data(table)
        .enter()
        .append("rect")
        .classed("bar", true)
        .style("fill", "darkgreen")
        .attr("x", function(d, i) { return 0.5*gap + i*(barwidth+gap); })
        .attr("y", size[1])
        .attr("width", barwidth)
        .attr("height", 0.0)
        .transition()
        .delay(function(d,i) { return i*50; })
        .duration(300)
        .attr("y", function(d) { return (1 - yscale(d[ycolumn]))*size[1]; })
        .attr("height", function(d) { return size[1] - (1 - yscale(d[ycolumn]))*size[1]; });

    g.selectAll("rect.bar")
        .append("title").text(function(d) { return d[ycolumn]; });

/*    return {*/
        
    /*};*/
    return null;
}
