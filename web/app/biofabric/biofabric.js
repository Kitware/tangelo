/*jslint unparam: true*/

/*globals window, d3, $*/

$(function () {
    "use strict";

    d3.json("miserables.json", function (error, data) {
        var width,
            height,
            svg,
            nodey,
            linkx,
            queue,
            nodes,
            node,
            nodeColor,
            linkColor,
            mode,
            shadow,
            margin,
            links;

        mode = "bfs";
        shadow = false;

        data.nodes.forEach(function (d, i) {
            d.degree = 0;
            d.visited = false;
            d.neighbors = [];
            d.incident = [];
        });

        data.links.forEach(function (d) {
            d.placed = false;
            d.source = data.nodes[d.source];
            d.target = data.nodes[d.target];
            d.source.neighbors.push(d.target);
            d.target.neighbors.push(d.source);
            d.source.incident.push(d);
            d.target.incident.push(d);
            d.source.degree += 1;
            d.target.degree += 1;
        });


        function addNeighbor(d) {
            if (!d.visited) {
                queue.push(d);
                d.visited = true;
            }
        }

        // Order nodes
        if (mode === "degree") {
            data.nodes.sort(function (a, b) { return d3.descending(a.degree, b.degree); });
            nodes = data.nodes;
        } else if (mode === "bfs") {
            data.nodes.sort(function (a, b) { return d3.descending(a.degree, b.degree); });
            data.nodes.forEach(function (d) {
                d.neighbors.sort(function (a, b) {
                    return d3.descending(a.degree, b.degree);
                });
            });

            // Start with the most connected node
            queue = [data.nodes[0]];
            data.nodes[0].visited = true;
            nodes = [];

            // Do breadth-first search from that node
            while (queue.length > 0) {
                node = queue.shift();
                nodes.push(node);
                node.neighbors.forEach(addNeighbor);
            }
        } else if (mode === "group") {
            data.nodes.sort(function (a, b) { return d3.ascending(a.group, b.group); });
            nodes = data.nodes;
        }

        // Order links
        nodes.forEach(function (d, i) {
            d.index = i;
        });

        function otherNode(e, n) {
            return (e.source === n ? e.target : e.source);
        }

        nodes.forEach(function (d, i) {
            d.incident.sort(function (a, b) {
                return d3.ascending(otherNode(a, d).index, otherNode(b, d).index);
            });
        });

        links = [];
        nodes.forEach(function (d) {
            d.incident.forEach(function (e) {
                if (shadow || !e.placed) {
                    e.placed = true;
                    links.push(e);
                }
            });
        });

        // Draw the graph
        margin = {top: 20, right: 10, bottom: 20, left: 60};
        width = $(window).width() - margin.left - margin.right;
        height = $(window).height() - margin.top - margin.bottom;

        svg = d3.select("#canvas")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        nodey = d3.scale.linear().domain([0, nodes.length - 1]).range([0, height]);
        linkx = d3.scale.linear().domain([0, links.length - 1]).range([0, width]);

        nodes.forEach(function (d, i) {
            d.minx = width;
            d.maxx = 0;
        });
        links.forEach(function (d, i) {
            var x = linkx(i);
            d.source.minx = Math.min(d.source.minx, x);
            d.source.maxx = Math.max(d.source.maxx, x);
            d.target.minx = Math.min(d.target.minx, x);
            d.target.maxx = Math.max(d.target.maxx, x);
        });

        nodeColor = d3.scale.category10();
        linkColor = d3.scale.category10();

        svg.selectAll("line.node").data(nodes).enter().append("line")
            .attr("class", "node")
            .attr("x1", function (d) { return d.minx; })
            .attr("x2", function (d) { return d.maxx; })
            .attr("y1", function (d) { return nodey(d.index); })
            .attr("y2", function (d) { return nodey(d.index); })
            .style("stroke", function (d) { return nodeColor(d.index); });

        svg.selectAll("line.link").data(links).enter().append("line")
            .attr("class", "link")
            .attr("x1", function (d, i) { return linkx(i); })
            .attr("x2", function (d, i) { return linkx(i); })
            .attr("y1", function (d) { return nodey(d.source.index); })
            .attr("y2", function (d) { return nodey(d.target.index); })
            .style("stroke", function (d, i) { return linkColor(i); });

        svg.selectAll("circle.source").data(links).enter().append("circle")
            .attr("class", "source")
            .attr("cx", function (d, i) { return linkx(i); })
            .attr("cy", function (d) { return nodey(d.source.index); })
            .attr("r", 2)
            .style("fill", function (d, i) { return linkColor(i); });

        svg.selectAll("circle.target").data(links).enter().append("circle")
            .attr("class", "target")
            .attr("cx", function (d, i) { return linkx(i); })
            .attr("cy", function (d) { return nodey(d.target.index); })
            .attr("r", 2)
            .style("fill", function (d, i) { return linkColor(i); });

        svg.selectAll("text.node").data(nodes).enter().append("text")
            .attr("class", "node")
            .attr("x", function (d) { return d.minx - 3; })
            .attr("y", function (d, i) { return nodey(i); })
            .text(function (d) { return d.name; });
    });
});