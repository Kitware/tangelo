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
promed.startdate = null;
promed.enddate = null;
promed.colormaps = {
    disease: d3.scale.category20(),
    location: d3.scale.category20()
};
promed.zoom = {
    behavior: null,
    mousedown: null
};
promed.timeoutID = {
    diseases: null,
    locations: null
};
promed.diseases = null;
promed.locations = null;
promed.searchdiseases = undefined;
promed.searchlocations = undefined;

function roundDay(dateval) {
    var date = new Date(dateval);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).valueOf();
}

function getNodeDate(n) {
    var datestring;

    datestring = n.promed_id.split(".")[0];
    year = +datestring.substr(0, 4);
    month = +datestring.substr(4, 2) - 1;
    day = +datestring.substr(6, 2);

    return new Date(year, month, day).valueOf();
}

function filterGraph(graph, degree, startdate, enddate, diseaselist, locationlist) {
    var nodes,
        links,
        filterdisease,
        filterlocation;

    filterdisease = diseaselist ? function (d) {
        return d.toLowerCase() in diseaselist;
    } :
    function (d) { return true; };

    filterlocation = locationlist ? function (d) {
        return d.toLowerCase() in locationlist;
    } :
    function (d) { return true; };

    // Filter the data by degree.
    nodes = graph.nodes.filter(function (v) {
        var vdate;
        vdate = getNodeDate(v);

        return (v.degree >= degree) &&
            (vdate >= startdate && vdate <= enddate) &&
            (filterdisease(v.disease)) &&
            (filterlocation(v.location));
    });

    // Create a node set for quick membership testing.
    nodeset = {};
    $.each(nodes, function (i, v) {
        nodeset[v.promed_id] = true;
    });

    // Filter the links by membership of its nodes in the node set.
    links = graph.links.filter(function (v) {
        return nodeset.hasOwnProperty(v.source.promed_id) && nodeset.hasOwnProperty(v.target.promed_id);
    });

    return {
        nodes: nodes,
        links: links
    };
}

function search(which, term) {
    var results,
        set;

    results = promed[which].filter(function (d) {
        return d.toLowerCase().indexOf(term.toLowerCase()) !== -1;
    });
    results = results.map(function (s) { return s.toLowerCase(); });

    set = promed["search" + which] = {};

    $.each(results, function (i, v) {
        set[v] = true;
    });

    update();
}

function update() {
    var nodes,
        links,
        filtered,
        start_time,
        end_time;

    filtered = filterGraph(promed.graph, promed.degree, promed.startdate, promed.enddate, promed.searchdiseases, promed.searchlocations);

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
        .style("stroke", "black")
        .style("fill", "white")
        .on("mousedown", function () {
            // Suspend the initiation of drag behavior while the user is
            // clicking on a node.
            d3.select("#graph")
                .on("mousedown.zoom", null);

            // Install a "global" mouseup handler so the release of the mouse
            // button is detected even if the user moves the mouse faster than
            // the node can catch up - use it to (2) uninstall itself and (2)
            // restore the drag behavior callback.
            d3.select(window.document)
                .on("mouseup.catchall", function () {
                    d3.select("#graph")
                        .on("mousedown.zoom", promed.zoom.mousedown);

                    d3.select(window.document)
                        .on("mouseup.catchall", null);
                });
        })
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
        });

    // Color the nodes according to the current colormap.
    colormode = $("input[name=colormap]:radio:checked").attr("id");
    nodes.transition()
        .duration(1000)
        .attr("r", 5.0)
        .style("opacity", 1.0)
        .style("fill", function (d) {
            return promed.colormaps[colormode](d[colormode]);
        });

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
        .style("opacity", 0.5);

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
    promed.force.nodes(filtered.nodes)
        .links(filtered.links)
        .start();
}

function prepare(graph) {
    var idxmap,
        diseasemap,
        locationmap;

    // Make an index map for the nodes, as well as sets of diseases, locations,
    // etc. found in the node attributes.
    idxmap = {};
    diseasemap = {};
    locationmap = {};

    $.each(graph.nodes, function (i, v) {
        if (idxmap[v.promed_id]) {
            throw "fatal error: duplicate promed_id '" + v.promed_id + "'";
        }

        idxmap[v.promed_id] = i;

        v.degree = 0;

        diseasemap[v.disease] = true;
        locationmap[v.location] = true;
    });

    // Store global lists of the promed attributes.
    promed.diseases = Object.keys(diseasemap);
    promed.locations = Object.keys(locationmap);

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
    });

    return graph;
}

$(function () {
    tangelo.requireCompatibleVersion("0.2");

    var spinnerUpdate,
        graph;

    // Get the window size.
    promed.width = $(window).width();
    promed.height = $(window).height();

    // Set pan/zoom mouse interaction on the SVG element.
    promed.zoom.behavior = d3.behavior.zoom()
        .scale(1.0)
        .translate([0.0, 0.0])
        .on("zoom", function () {
            d3.select("#group")
                .attr("transform", "translate(" + d3.event.translate[0] + ", " + d3.event.translate[1] + ") scale(" + d3.event.scale + ")");
        });

    // Install the zoom behavior on the graph element.
    graph = d3.select("#graph");
    graph.call(d3.behavior.zoom()
        .scale(1.0)
        .translate([0.0, 0.0])
        .on("zoom", function () {
            d3.select("#group")
                .attr("transform", "translate(" + d3.event.translate[0] + ", " + d3.event.translate[1] + ") scale(" + d3.event.scale + ")");
        }));

    // Save the mousedown callback from the zoom behavior so it can be
    // suppressed/restored at will.
    promed.zoom.mousedown = graph.on("mousedown.zoom");

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

        // Find the minimum and maximum dates in the data.
        mindate = Number.MAX_VALUE;
        maxdate = 0;

        $.each(promed.graph.nodes, function (i, v) {
            var date = getNodeDate(v);

            if (mindate > date) {
                mindate = date;
            }

            if (maxdate < date) {
                maxdate = date;
            }
        });

        displayTimes = function (evt, ui) {
            var low,
                high,
                printdate;

            printdate = function (date) {
                return date.toString()
                    .split(" ")
                    .slice(0, 4)
                    .join(" ");
            };

            low = printdate(new Date(ui.values[0]));
            high = printdate(new Date(ui.values[1]));

            d3.select("#starttime")
                .text(low);
            d3.select("#endtime")
                .text(high);
        }

        $("#timefilt").slider({
            range: true,
            min: mindate,
            max: maxdate,
            slide: displayTimes,
            change: function (evt, ui) {
                displayTimes(evt, ui);

                promed.startdate = roundDay($(this).slider("values", 0));
                promed.enddate = roundDay($(this).slider("values", 1));

                if (promed.graph) {
                    update();
                }
            }
        });
        $("#timefilt").slider("values", 0, mindate);
        $("#timefilt").slider("values", 1, maxdate);
        displayTimes(undefined, {values: [mindate, maxdate]});

        d3.selectAll("input[name=colormap]")
            .on("click", function () {
                update();
            });

        keyup = function (mode) {
            return function () {
                // Cancel any pending search (from, e.g., the previous
                // keystroke).
                if (promed.timeoutID[mode] !== null) {
                    window.clearTimeout(promed.timeoutID[mode]);
                }

                // If the user actually typed something in (rather than deleting
                // the search terms), then schedule a search operation for a
                // little bit from now.
                if (this.value.length > 0) {
                    promed.timeoutID[mode] = window.setTimeout(search, 300, mode, this.value);
                } else {
                    promed["search" + mode] = undefined;
                    update();
                }
            };
        };

        d3.select("#disease-search")
            .on("keyup", keyup("diseases"));

        d3.select("#location-search")
            .on("keyup", keyup("locations"));

        update();
    });
});
