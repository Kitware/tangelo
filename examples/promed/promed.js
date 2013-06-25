var promed = {};
promed.data = null;
promed.force = null;
promed.width = null;
promed.height = null;
promed.transform = {
    scale: 1.0,
    translate: [0.0, 0.0]
};

function update() {
    var nodes,
        links;

    // TODO: filter the data here according to some criteria (perhaps passed in
    // as args to this function).

    // Recompute the circle elements.
    nodes = d3.select("#nodes")
        .selectAll("circle.node", function (d) {
            return d.promed_id;
        })
        .data(promed.data.nodes);

    nodes.enter()
        .append("circle")
        .classed("node", true)
        .attr("r", 0.0)
        .style("opacity", 0.0)
        .style("fill", "blue")
        .style("stroke", "black")
        .each(function (d) {
            var cfg,
                msg,
                date;

            date = d.promed_id.split(".")[0];
            msg = date.substr(0, 4) + "-" + date.substr(4, 2) + "-" + date.substr(6) + ": " + d.title;

            cfg = {
                html: true,
                container: "body",
                placement: "top",
                trigger: "hover",
                content: msg,
                delay: {
                    show: 0,
                    hide: 0
                }
            };

            $(this).popover(cfg);
        })
        .transition()
        .duration(1000)
        .attr("r", 5.0)
        .style("opacity", 1.0);

    nodes.exit()
        .transition()
        .duration(1000)
        .style("opacity", 0.0)
        .style("r", 0.0)
        .remove();

    nodes.call(promed.force.drag);

    // Now the links.
    links = d3.select("#links")
        .selectAll("line.link", function (d) {
            d.target + "->" + d.source;
        })
        .data(promed.data.links);

    links.enter()
        .append("line")
        .classed("link", true)
        .style("stroke", "black")
        .style("stroke-width", 0.0)
        .style("opacity", 0.0)
        .transition()
        .duration(1000)
        .style("stroke-width", 1.0)
        .style("opacity", 1.0);

    links.exit()
        .transition()
        .duration(1000)
        .style("opacity", 0.0)
        .style("stroke-width", 0.0)
        .remove();

    promed.force.on("tick", function () {
        links.attr("x1", function (d) { return d.source.x; })
            .attr("y1", function (d) { return d.source.y; })
            .attr("x2", function (d) { return d.target.x; })
            .attr("y2", function (d) { return d.target.y; });

        nodes.attr("transform", function (d) {
            return "translate(" + d.x + ", " + d.y + ")";
        });
    });

    // Set the force layout up and start it.
    promed.force.nodes(promed.data.nodes)
        .links(promed.data.links)
        .start();
}

function computeIndices(graph) {
    // Make an index map for the nodes.
    idxmap = {};
    $.each(graph.nodes, function (i, v) {
        if (idxmap[v.promed_id]) {
            throw "fatal error: duplicate promed_id '" + v.promed_id + "'";
        }

        idxmap[v.promed_id] = i;
    });

    // Replace each target and source in the link list with an index.
    $.each(graph.links, function (i, v) {
        v.source = idxmap[v.source];
        v.target = idxmap[v.target];
    });

    return graph;
}

$(function () {
    tangelo.requireCompatibleVersion("0.2");

    // Get the window size.
    promed.width = $(window).width();
    promed.height = $(window).height();

    // Set pan/zoom mouse interaction on the SVG element.
    d3.select("#graph")
        .call(d3.behavior.zoom()
            .scale(1.0)
            .translate([0.0, 0.0])
            .on("zoom", function () {
                console.log("yay");
                d3.select("#group")
                    .attr("transform", "translate(" + d3.event.translate[0] + ", " + d3.event.translate[1] + ") scale(" + d3.event.scale + ")");
            }));

    // Initialize a force layout object.
    promed.force = d3.layout.force()
        .charge(-500)
        .linkDistance(100)
        .gravity(0.2)
        .friction(0.6)
        .size([promed.width, promed.height]);

    // Read in the data.
    d3.json("promed_links.json", function (err, json) {
        if (err) {
            throw "Could not load file promed_links.json: " + err;
        }

        promed.data = computeIndices(json);
        update();
    });
});
