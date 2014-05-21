/*jslint browser:true, unparam:true */
/*globals $, console, d3, tangelo */

var color = null;
var force = null;
var graph = null;
var svg = null;
var width = 0;
var height = 0;
var transition_time;

var enron = {};
enron.date = null;
enron.range = null;
enron.center = null;
enron.degree = null;
enron.host = null;
enron.database = null;
enron.collection = null;

function updateGraph() {
    "use strict";

    var center,
        data,
        end_date,
        hops,
        change_button,
        start_date,
        stringifyDate,
        update;

    update = d3.select("#update");
    change_button = !update.attr("disabled");

    if (change_button) {
        update.attr("disabled", true)
            .text("Updating...");
    }

    // Construct a Javascript date object from the date slider.
    start_date = new Date(enron.date.slider("value"));

    // Create another date that is ahead of the start date by the number of days
    // indicated by the slider (i.e., advanced from that date by the number of
    // milliseconds in that many days).
    end_date = new Date(start_date.getTime() + enron.range.slider("value") * 86400 * 1000);

    center = enron.center.val();

    hops = enron.degree.spinner("value");

    stringifyDate = d3.time.format("%Y-%m-%d");

    data = {
        start_time: stringifyDate(start_date),
        end_time: stringifyDate(end_date),
        center: center,
        degree: hops
    };

    $.ajax({
        url: "emailers/" + enron.host + "/" + enron.database + "/" + enron.collection,
        data: data,
        dataType: "json",
        success: function (resp) {
            var angle,
                enter,
                link,
                map,
                newidx,
                node,
                tau;

            if (resp.error) {
                d3.select("#content")
                    .style("font-size", "14pt")
                    .style("padding-top", "20%")
                    .style("padding-left", "20%")
                    .style("padding-right", "20%")
                    .style("text-align", "center")
                    .html("There doesn't seem to be Mongo instance at <em>" + enron.host + "</em>" +
                        ", with database <em>" + enron.database + "</em> and collection <em>" + enron.collection + "</em>" +
                        ", or there is no data there." +
                        "  See these <a href=\"http://tangelo.readthedocs.org/en/latest/setup.html#enron-email-network\">instructions</a> for help setting this up.");
                return;
            }

            if (change_button) {
                d3.select("#update")
                    .attr("disabled", null)
                    .text("Update");
            }

            if (resp.error) {
                console.log("error: " + resp.error);
                return;
            }

            // Save the last iteration of node data, so we can transfer the
            // positions to the new iteration.
            map = {};
            $.each(force.nodes(), function (i, v) {
                map[v.email] = v;
            });

            graph = resp.result;
            newidx = [];
            $.each(graph.nodes, function (i, v) {
                if (map.hasOwnProperty(v.email)) {
                    graph.nodes[i].x = map[v.email].x;
                    graph.nodes[i].y = map[v.email].y;
                } else {
                    newidx.push(i);
                }
            });

            tau = 2 * Math.PI;
            angle = tau / newidx.length;
            $.each(newidx, function (i, v) {
                graph.nodes[v].x = (width / 4) * Math.cos(i * angle) + (width / 2);
                graph.nodes[v].y = (height / 4) * Math.sin(i * angle) + (height / 2);
            });

            transition_time = 1000;

            link = svg.select("g#links")
                .selectAll(".link")
                .data(graph.edges, function (d) {
                    return d.id;
                });

            link.enter().append("line")
                .classed("link", true)
                .style("opacity", 0.0)
                .style("stroke-width", 0.0)
                .transition()
                .duration(transition_time)
                .style("opacity", 1.0)
                .style("stroke-width", 1.0);

            link.exit()
                .transition()
                .duration(transition_time)
                .style("opacity", 0.0)
                .style("stroke-width", 0.0)
                .remove();

            node = svg.select("g#nodes")
                .selectAll(".node")
                .data(graph.nodes, function (d) { return d.email; });

            enter = node.enter().append("circle")
                .classed("node", true)
                .attr("r", 10)
                .style("opacity", 0.0)
                .style("fill", "red");
            enter.transition()
                .duration(transition_time)
                .attr("r", 5)
                .style("opacity", 1.0)
                .style("fill", function (d) {
                    return color(d.distance);
                });

            enter.call(force.drag)
                .append("title")
                .text(function (d) {
                    return d.email || "(no email address)";
                });

            node.exit()
                .transition()
                .duration(transition_time)
                .style("opacity", 0.0)
                .attr("r", 0.0)
                .style("fill", "black")
                .remove();

            force.nodes(graph.nodes)
                .links(graph.edges)
                .start();

            force.on("tick", function () {
                link.attr("x1", function (d) { return d.source.x; })
                    .attr("y1", function (d) { return d.source.y; })
                    .attr("x2", function (d) { return d.target.x; })
                    .attr("y2", function (d) { return d.target.y; });

                node.attr("cx", function (d) { return d.x; })
                    .attr("cy", function (d) { return d.y; });
            });
        }
    });
}

function advanceTimer() {
    "use strict";

    var value;

    value = enron.date.slider("value") + 86400e3;
    enron.date.slider("value", value);

    updateGraph();
}

var timeout = null;
function toggleAnimation() {
    "use strict";

    var anim, update;

    anim = d3.select("#animate");
    update = d3.select("#update");

    if (anim.text() === "Animate") {
        anim.text("Stop animation")
            .classed("btn-success", false)
            .classed("btn-warning", true);
        update.attr("disabled", true);

        timeout = setInterval(advanceTimer, transition_time * 1.5);
    } else {
        anim.text("Animate")
            .classed("btn-success", true)
            .classed("brn-warning", false);
        update.attr("disabled", null);

        clearInterval(timeout);
    }
}

window.onload = function () {
    "use strict";

    // Create control panel.
    $("#control-panel").controlPanel();

    tangelo.config("config.json", function (config, status, error) {
        var displayDate;

        if (status !== "OK") {
            tangelo.fatalError("enron.js", "config.json file is required");
        } else if (!config.host) {
            tangelo.fatalError("enron.js", "config.json must have 'host' field");
        }

        enron.host = config.host;
        enron.database = config.database;
        enron.collection = config.collection;

        svg = d3.select("svg");

        width = $(window).width();
        height = $(window).height();
        force = d3.layout.force()
            .charge(-500)
            .linkDistance(100)
            .gravity(0.2)
            .friction(0.6)
            .size([width, height]);

        color = d3.scale.category20();

        // Activate the jquery controls.
        enron.date = $("#date");
        enron.range = $("#range");
        enron.center = $("#center");
        enron.degree = $("#degree");

        displayDate = d3.time.format("%b %e, %Y");
        enron.date.slider({
            min: new Date("January 1, 1998").getTime(),
            max: new Date("December 31, 2002").getTime(),
            value: new Date("December 13, 2000").getTime(),
            step: 86400,
            slide: function (evt, ui) {
                d3.select("#date-label")
                    .text(displayDate(new Date(ui.value)));
            },
            change: function (evt, ui) {
                d3.select("#date-label")
                    .text(displayDate(new Date(ui.value)));
            }
        });
        enron.date.slider("value", enron.date.slider("value"));

        enron.range.slider({
            min: 1,
            max: 6 * 7,
            value: 3,
            slide: function (evt, ui) {
                d3.select("#range-label")
                    .text(ui.value + " day" + (ui.value === 1 ? "" : "s"));
            },
            change: function (evt, ui) {
                d3.select("#range-label")
                    .text(ui.value + " day" + (ui.value === 1 ? "" : "s"));
            }
        });
        enron.range.slider("value", enron.range.slider("value"));

        enron.center.val("phillip.allen@enron.com");

        enron.degree.spinner({
            min: 1,
            max: 10
        });
        enron.degree.spinner("value", 2);

        d3.select("#update")
            .on("click", updateGraph);

        d3.select("#animate")
            .on("click", toggleAnimation);

        updateGraph();
    });
};
