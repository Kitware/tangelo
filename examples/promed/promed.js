var promed = {};
promed.graph = null;
promed.force = null;
promed.width = null;
promed.height = null;
promed.transform = {
    scale: 1.0,
    translate: [0.0, 0.0]
};
promed.degree = 0;

function filterGraph(graph, degree) {
    var nodes,
        links;

    // Filter the data by degree.
    nodes = graph.nodes.filter(function (v) {
        return v.degree >= degree;
    });

    // Create a node set for quick membership testing.
    nodeset = {};
    $.each(nodes, function (i, v) {
        nodeset[v.promed_id] = true;
    });

    // Filter the links by membership of its nodes in the node set.
    links = graph.links.filter(function (v) {
        //return (degree === 0 && v.degree === 0) || nodeset.hasOwnProperty(v.source.promed_id) && nodeset.hasOwnProperty(v.target.promed_id);
        return nodeset.hasOwnProperty(v.source.promed_id) && nodeset.hasOwnProperty(v.target.promed_id);
    });

    return {
        nodes: nodes,
        links: links
    };
}

function update() {
    var nodes,
        links,
        filtered,
        start_time,
        end_time;

    filtered = filterGraph(promed.graph, promed.degree);

    // Recompute the circle elements.
    nodes = d3.select("#nodes")
        .selectAll("circle.node")
        .data(filtered.nodes, function (d) {
            return d.promed_id;
        });

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
            msg = "<b>Date: </b>" + date.substr(0, 4) + "-" + date.substr(4, 2) + "-" + date.substr(6) + "<br>";
            msg += "<b>Title: </b>" + d.title + "<br>";
            msg += "<b>Disease: </b>" + d.disease + "<br>";
            msg += "<b>Location: </b>" + d.location + "<br>";
            msg += "<b>Source Organization: </b>" + d.source_organization + "<br>";
            msg += "<b>Degree: </b>" + d.degree + "<br>";
            msg += "<b>Promed ID: </b>" + d.promed_id;

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
        .selectAll("line.link")
        .data(filtered.links, function (d) {
            return d.target.promed_id + "->" + d.source.promed_id;
        });

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

function prepare(graph) {
    // Make an index map for the nodes.
    idxmap = {};
    $.each(graph.nodes, function (i, v) {
        if (idxmap[v.promed_id]) {
            throw "fatal error: duplicate promed_id '" + v.promed_id + "'";
        }

        idxmap[v.promed_id] = i;

        v.degree = 0;
    });

    // Replace each target and source in the link list with a reference to a
    // node.
    $.each(graph.links, function (i, v) {
        v.source = graph.nodes[idxmap[v.source]];
        v.target = graph.nodes[idxmap[v.target]];
    });

    // Compute the degree of each node, and replace the indices in the links
    // list with references to nodes.
    $.each(graph.links, function (i, v) {
        v.source.degree++;
        v.target.degree++;

        //v.source = graph.nodes[v.source];
        //v.target = graph.nodes[v.target];
    });

    return graph;
}

$(function () {
    tangelo.requireCompatibleVersion("0.2");

    var spinnerUpdate;

    // Get the window size.
    promed.width = $(window).width();
    promed.height = $(window).height();

    // Set pan/zoom mouse interaction on the SVG element.
    d3.select("#graph")
        .call(d3.behavior.zoom()
            .scale(1.0)
            .translate([0.0, 0.0])
            .on("zoom", function () {
                d3.select("#group")
                    .attr("transform", "translate(" + d3.event.translate[0] + ", " + d3.event.translate[1] + ") scale(" + d3.event.scale + ")");
            }));

    // Initialize the degree spinner.
    spinnerUpdate = function (evt, ui) {
        var value = ui.value || $(this).spinner("value");
        console.log(value);

        if (promed.graph) {
            update({
                degree: value
            });
        }
    };

    $("#degreefilt").spinner({
        min: 0,
        spin: function (evt, ui) {
            promed.degree = ui.value;

            if (promed.graph) {
                update();
            }
        },
        change: function (evt, ui) {
            promed.degree = $(this).spinner("value");

            if (promed.graph) {
                update();
            }
        }
    });
    $("#degreefilt").spinner("value", 0);

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

        // Whip the data into shape, so that D3's graph layout can make use of
        // it easily.
        promed.graph = prepare(json);
        update();
    });
});
