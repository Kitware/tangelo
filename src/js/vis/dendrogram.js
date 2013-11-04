/*jslint browser: true, unparam: true, nomen: true */

(function (tangelo, d3) {
    "use strict";

    tangelo.vis.dendrogram = function (spec) {
        var label = tangelo.accessor(spec.label, ""),
            distance = tangelo.accessor(spec.distance, 1),
            id = tangelo.accessor(spec.id, 0),
            that = this,
            margin = {top: 20, right: 120, bottom: 20, left: 120},
            width = 1200 - margin.right - margin.left,
            height = 800 - margin.top - margin.bottom,
            duration = 750,
            root = spec.root || spec.data,
            data = spec.data,
            mode = spec.mode || "hide",
            tree = d3.layout.partition()
                .size([height, width])
                .value(function () { return 1; })
                .sort(d3.ascending),
            line = d3.svg.line()
                .interpolate("step-before")
                .x(function (d) { return d.y; })
                .y(function (d) { return d.x; }),
            svg = d3.select(spec.el).append("svg")
                .attr("width", width + margin.right + margin.left)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        root.x0 = height / 2;
        root.y0 = 0;

        update();

        // Toggle children on click.
        function click(d) {
            if (mode === "hide") {
                if (d.children) {
                    d._children = d.children;
                    d.children = null;
                } else {
                    d.children = d._children;
                    d._children = null;
                }
            } else if (mode === "focus") {
                root = d;
            } else if (mode === "label") {
                d.showLabel = d.showLabel ? false : true;
            }
            update({source: d});
        }

        function reset() {
            function unhideAll(d) {
                if (!d.children) {
                    d.children = d._children;
                    d._children = null;
                }
                if (d.children) {
                    d.children.forEach(unhideAll);
                }
            }
            unhideAll(data);
            update({root: data});
        }

        function firstChild(d) {
            if (d.children) {
                return firstChild(d.children[0]);
            }
            if (d._children) {
                return firstChild(d._children[0]);
            }
            return d;
        }

        function lastChild(d) {
            if (d.children) {
                return lastChild(d.children[d.children.length - 1]);
            }
            if (d._children) {
                return lastChild(d._children[d._children.length - 1]);
            }
            return d;
        }

        function update(specUpdate) {
            specUpdate = specUpdate || {};
            mode = specUpdate.mode || mode;
            root = specUpdate.root || root;
            data = specUpdate.data || data;

            // Compute the new tree layout.
            var nodes = tree.nodes(root).reverse(),
                links = tree.links(nodes),
                source = specUpdate.source || root,
                node,
                nodeEnter,
                nodeUpdate,
                nodeExit,
                link,
                maxY,
                visibleLeaves;

            visibleLeaves = 0;
            function setPosition(node, pos) {
                var xSum = 0;
                node.y = pos;
                node.x = node.x + node.dx / 2;
                if (node.children) {
                    node.children.forEach(function (d) {
                        setPosition(d, pos + 10 * distance(d));
                        xSum += d.x;
                    });
                    node.x = xSum / node.children.length;
                } else {
                    visibleLeaves += 1;
                }
            }
            setPosition(root, 0);

            // Normalize Y to fill space
            maxY = d3.extent(nodes, function (d) { return d.y; })[1];
            nodes.forEach(function (d) {
                d.y = d.y / maxY * (width - 150);
            });

            // Update the nodes…
            node = svg.selectAll("g.node")
                .data(nodes, function(d) { return id(d); });

            // Enter any new nodes at the parent's previous position.
            nodeEnter = node.enter().append("g")
                .attr("class", "node")
                .attr("transform", function() { return "translate(" + source.y0 + "," + source.x0 + ")"; })
                .on("click", click);

            nodeEnter.append("circle")
                .attr("r", 1e-6)
                .style("stroke", "none")
                .style("opacity", function(d) { return d._children ? 1 : 0; })
                .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

            nodeEnter.append("text")
                .attr("x", 10)
                .attr("dy", ".35em")
                .attr("text-anchor", "start")
                .style("font-size", "10px")
                .text(label)
                .style("fill-opacity", 1e-6);

            // Transition nodes to their new position.
            nodeUpdate = node.transition()
                .duration(duration)
                .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

            nodeUpdate.select("circle")
                .attr("r", 7.5)
                .style("opacity", function(d) { return d._children ? 1 : 0; })
                .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

            nodeUpdate.select("text")
                .text(function (d) {
                    if (d._children || (d.children && d.showLabel)) {
                        return label(firstChild(d)) + " ... " + label(lastChild(d));
                    }
                    if (visibleLeaves < height / 8) {
                        return label(d);
                    }
                    return "";
                })
                .style("fill-opacity", 1);

            // Transition exiting nodes to the parent's new position.
            nodeExit = node.exit().transition()
                .duration(duration)
                .attr("transform", function() { return "translate(" + source.y + "," + source.x + ")"; })
                .remove();

            nodeExit.select("circle")
                .attr("r", 1e-6);

            nodeExit.select("text")
                .style("fill-opacity", 1e-6);

            // Update the links…
            link = svg.selectAll("path.link")
                .data(links, function(d) { return id(d.target); });

            // Enter any new links at the parent's previous position.
            link.enter().insert("path", "g")
                .attr("class", "link")
                .style("stroke", "black")
                .style("stroke-width", "1px")
                .style("fill", "none")
                .attr("d", function() {
                    var o = {x: source.x0, y: source.y0};
                    //return diagonal({source: o, target: o});
                    return line([o, o]);
                });

            // Transition links to their new position.
            link.transition()
                .duration(duration)
                .attr("d", function (d) {
                    return line([d.source, d.target]);
                });

            // Transition exiting nodes to the parent's new position.
            link.exit().transition()
                .duration(duration)
                .attr("d", function() {
                    var o = {x: source.x, y: source.y};
                    return line([o, o]);
                })
                .remove();

            // Stash the old positions for transition.
            nodes.forEach(function(d) {
                d.x0 = d.x;
                d.y0 = d.y;
            });
        }

        function download(format) {
            if (format === "pdf") {
                var node = svg.selectAll("g.node").select("circle")
                    .attr("r", function (d) { return d._children ? 7.5 : 0; }),
                    s = new window.XMLSerializer(),
                    d = d3.select("svg").node(),
                    str = s.serializeToString(d);

                // Change back to normal
                node.attr("r", 7.5);

                d3.json("/service/svg2pdf").send("POST", str, function (error, data) {
                    window.location = "/service/svg2pdf?id=" + data.result;
                });
            } else {
                window.alert("Unsupported export format type: " + format);
            }
        }

        that.update = update;
        that.reset = reset;
        that.download = download;

        return that;
    };

}(window.tangelo, window.d3));
