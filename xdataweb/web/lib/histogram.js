// A histogram object.

// Global namespace for this file.
var histogram = {};

histogram.histogram = function(svgelem, translate){
    var id = ID.next();

    var g = d3.select(svgelem).append("g")
        .attr("id", id);

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
