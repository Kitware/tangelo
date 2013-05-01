/*jslint browser:true */

/*globals $, d3, tangelo */

var color = null;
var force = null;
var graph = null;
var svg = null;
var width = 0;
var height = 0;

var enron = {};
enron.date = null;
enron.range = null;
enron.center = null;
enron.degree = null;
enron.host = null;

function stringifyDate(d) {
    "use strict";

    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}

function displayDate(d) {
    "use strict";

    return tangelo.date.monthNames()[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
}

function updateGraph() {
    "use strict";

    var center,
        data,
        end_date,
        degree,
        hops,
        start_date;

    d3.select("#update")
        .attr("disabled", true)
        .text("Updating...");

    // Construct a Javascript date object from the date slider.
    start_date = new Date(enron.date.slider("value"));

    // Create another date that is ahead of the start date by the number of days
    // indicated by the slider (i.e., advanced from that date by the number of
    // milliseconds in that many days).
    end_date = new Date(start_date.getTime() + enron.range.slider("value") * 86400 * 1000);

    center = enron.center.val();

    hops = enron.degree.spinner("value");

    data = {
        start_time: stringifyDate(start_date),
        end_time: stringifyDate(end_date),
        center: center,
        degree: hops
    };

    $.ajax({
        url: "service/emailers/" + enron.host + "/xdata/enron",
        data: data,
        dataType: "json",
        success: function (resp) {
            var enter,
                link,
                map,
                node;

            d3.select("#update")
                .attr("disabled", null)
                .text("Update");

            if (resp.error !== null) {
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
            $.each(graph.nodes, function (i, v) {
                if (map.hasOwnProperty(v.email)) {
                    graph.nodes[i].x = map[v.email].x;
                    graph.nodes[i].y = map[v.email].y;
                }
            });

            console.log("Got " + graph.nodes.length + " nodes");
            console.log("Got " + graph.edges.length + " edges");

            force.nodes(graph.nodes)
                .links(graph.edges)
                .start();

            link = svg.select("g#links")
                .selectAll(".link")
                .data(graph.edges, function (d) {
                    return d.id;
                });

            link.enter().append("line")
                .classed("link", true);

            link.exit()
                .transition()
                .duration(1000)
                .attr("x1", width)
                .attr("x2", width)
                .attr("y1", height/2)
                .attr("y2", height/2)
                .style("opacity", 0.0)
                .remove();

            node = svg.select("g#nodes")
                .selectAll(".node")
                .data(graph.nodes, function (d) { return d.email; });

            enter = node.enter().append("circle")
                .classed("node", true)
                .attr("r", 0)
                .style("opacity", 0.0)
                .style("fill", function (d) {
                    return color(d.distance);
                });
            enter.transition()
                .duration(500)
                .attr("r", 5)
                .style("opacity", 1.0);

            enter.call(force.drag)
                .append("title")
                .text(function (d) {
                    return d.email || "(no email address)";
                });

            node.exit()
                .transition()
                .duration(1000)
                .style("opacity", 0.0)
                .attr("cx", width)
                .attr("cy", height/2)
                .attr("r", 0.0)
                .remove();

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

function toggleAnimation() {
    anim = d3.select("#animate");
    if (anim.text() === "Animate") {
        anim.text("Stop animation")
            .classed("btn-success", false)
            .classed("btn-warning", true);
    } else {
        anim.text("Animate")
            .classed("btn-success", true)
            .classed("brn-warning", false);
    }
}

window.onload = function () {
    "use strict";

    tangelo.util.defaults("defaults.json", function (defaults) {
        enron.host = (defaults && defaults.get("host")) || "mongo";

        console.log("enron.host: " + enron.host);

        svg = d3.select("svg");

        width = $(window).width();
        height = $(window).height();
        force = d3.layout.force()
            .charge(-240)
            .linkDistance(50)
            .gravity(0.5)
            .size([width, height]);

        color = d3.scale.category20();

        // Activate the jquery controls.
        enron.date = $("#date");
        enron.range = $("#range");
        enron.center = $("#center");
        enron.degree = $("#degree");

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
    });
};
