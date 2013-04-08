graph = null;

enron = {};
enron.date = null;
enron.range = null;
enron.degree = null;

window.onload = function () {
    "use strict";

    var color,
        force,
        height,
        svg,
        width;

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
    enron.degree = $("#degree");

    tangelo.util.getMongoRange("mongo", "xdata", "enron", "date", function (r) {
        console.log(r);
        enron.date.slider({
            min: r[0].$date,
            max: r[1].$date,
            slide: function (evt, ui) {
                d3.select("#date-label")
                    .text(ui.value);
            }
        });
    });

    d3.json("service/emailers/mongo/xdata/enron?start_time=2000-12-13&end_time=2000-12-14&center=phillip.allen@enron.com&degree=2", function (error, data) {
        var //graph,
            link,
            node,
            x;

        if (error !== null) {
            console.log("oops something bad happened :(");
            return;
        }

        if (data.error !== null) {
            console.log("error: " + data.error);
            return;
        }

        graph = data.result;

        force.nodes(graph.nodes)
            .links(graph.edges)
            .start();

        link = svg.select("g#links")
            .selectAll(".link")
            .data(graph.edges);

        link.enter().append("line")
            .classed("link", true);
            //.style("stroke-width", 3);

        node = svg.select("g#nodes")
            .selectAll(".node")
            .data(graph.nodes);
        node.enter().append("circle")
            .classed("node", true)
            .attr("r", 5)
            .style("fill", function (d) {
                return color(d.distance);
            })
            .call(force.drag);

        node.append("title")
            .text(function (d) { return d.email? d.email : "(no email address)"; });

        force.on("tick", function () {
            link.attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });

            node.attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; });
        });
    });
};
