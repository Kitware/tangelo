/*jslint browser: true, unparam: true, nomen: true */

(function (tangelo, $, d3) {
    "use strict";

    if (!($ && $.widget && d3)) {
        $.fn.dendrogram = tangelo.unavailable({
            plugin: "dendrogram",
            required: ["JQuery", "JQuery UI", "d3"]
        });
        return;
    }

    $.widget("tangelo.dendrogram", {
        options: {
            label: null,
            distance: null,
            id: null,
            margin: {
                top: 20,
                right: 120,
                bottom: 20,
                left: 120
            },
            nodeLimit: null,
            duration: 750,
            root: null,
            data: null,
            mode: "hide",
            nodesize: 7.5,
            textsize: 10,
            orientation: "horizontal",
            initialize: null
        },

        _missing: {
            label: "",
            distance: 1,
            id: 0
        },

        orientation: {
            abscissa: "y",
            ordinate: "x",
            heightvar: "height",
            widthvar: "width",
            xfunc: function (_, v) {
                return v;
            }
        },

        _create: function () {
            var options,
                that = this;

            if (this.options.orientation === "vertical") {
                this.orientation = {
                    abscissa: "x",
                    ordinate: "y",
                    heightvar: "width",
                    widthvar: "height",
                    xfunc: function (that, v) {
                        return that.width - v;
                    }
                };
            } else if (this.options.orientation !== "horizontal") {
                throw "illegal option for 'orientation': " + this.options.orientation;
            }

            this.tree = d3.layout.partition()
                .value(function () { return 1; })
                .sort(d3.ascending);

            this.line = d3.svg.diagonal()
                .projection(function (d) {
                    return [that.orientation.xfunc(that, d[that.orientation.abscissa]), d[that.orientation.ordinate]];
                });

            this.svg = d3.select(this.element.get(0))
                .append("svg")
                .append("g");

            options = $.extend(true, {}, this.options);
            delete options.disabled;
            delete options.create;
            this._setOptions(options);
        },

        _setOption: function (key, value) {
            if (key === "label" || key === "distance" || key === "id") {
                this._super(key, tangelo.accessor(value, this._missing[key]));
            } else {
                this._super(key, value);
            }
        },

        _setOptions: function (options) {
            var that = this;

            $.each(options, function (key, value) {
                that._setOption(key, value);
            });

            this._update();
        },

        _update: function () {
            this.width = 1200 - this.options.margin.right - this.options.margin.left;
            this.height = 800 - this.options.margin.top - this.options.margin.bottom;

            if (!this.options.root) {
                this.options.root = this.options.data;
            }

            if (!this.options.mode) {
                this.options.mode = "hide";
            }

            this.tree.size([this.height, this.width]);

            d3.select(this.element.get(0))
                .select("svg")
                .attr("width", this.width + this.options.margin.right + this.options.margin.left)
                .attr("height", this.height + this.options.margin.top + this.options.margin.bottom)
                .select("g")
                .attr("transform", "translate(" + this.options.margin.left + "," + this.options.margin.top + ")");

            //this.options.root.x0 = this.height / 2;
            this.options.root.x0 = this[this.orientation.heightvar] / 2;
            this.options.root.y0 = 0;

            // Compute the new tree layout.
            var nodes = this.tree.nodes(this.options.root).reverse(),
                links = this.tree.links(nodes),
                source = this.options.source || this.options.root,
                node,
                nodeEnter,
                nodeUpdate,
                nodeExit,
                link,
                maxY,
                visibleLeaves,
                filteredNodes,
                filteredLinks,
                that = this;

            visibleLeaves = 0;
            function setPosition(node, pos) {
                var xSum = 0;
                node.y = pos;
                node.x = node.x + node.dx / 2;
                if (!node.parent) {
                    node.parent = node;
                }
                if (node.children) {
                    node.children.forEach(function (d) {
                        d.parent = node;
                        setPosition(d, pos + 10 * that.options.distance(d));
                        xSum += d.x;
                    });
                    node.x = xSum / node.children.length;
                } else {
                    visibleLeaves += 1;
                }
            }
            setPosition(this.options.root, 0);

            // Normalize Y to fill space
            maxY = d3.extent(nodes, function (d) {
                return d.y;
            })[1];
            nodes.forEach(function (d) {
                d.y = d.y / maxY * (that.width - 150);
            });

            if (this.options.nodeLimit && nodes.length > this.options.nodeLimit) {
                // Filter out everything beyond parent y-position to keep things interactive
                nodes.sort(function (a, b) {
                    return d3.ascending(a.parent.y, b.parent.y);
                });
                nodes.forEach(function (d, i) {
                    d.index = i;
                });
                filteredNodes = nodes.slice(0, this.options.nodeLimit);
                maxY = filteredNodes[filteredNodes.length - 1].parent.y;
                filteredNodes.forEach(function (d) {
                    d.y = d.y > maxY ? maxY : d.y;
                });

                // Filter the links based on visible nodes
                filteredLinks = [];
                links.forEach(function (d) {
                    if (d.source.index < this.options.nodeLimit && d.target.index < this.options.nodeLimit) {
                        filteredLinks.push(d);
                    }
                });
                nodes = filteredNodes;
                links = filteredLinks;
            }

            // Toggle children on click.
            function click(d) {
                if (that.options.mode === "hide") {
                    if (d.children) {
                        d._children = d.children;
                        d.children = null;
                        d3.select(this)
                            .select("circle")
                            .classed("children-hidden", true);
                    } else {
                        d.children = d._children;
                        d._children = null;
                        d3.select(this)
                            .select("circle")
                            .classed("children-hidden", false);
                    }
                } else if (that.options.mode === "focus") {
                    that.options.root = d;
                } else if (that.options.mode === "label") {
                    d.showLabel = d.showLabel ? false : true;
                }
                //that._update({source: d});
                that._setOptions({source: d});
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

            function leafCount(d) {
                var children = d.children,
                    sum = 0;
                if (!children) {
                    children = d._children;
                }

                // I am an internal node, so total the leaves of the children
                if (children) {
                    children.forEach(function (child) {
                        sum += leafCount(child);
                    });
                    return sum;
                }

                // I am a leaf
                return 1;
            }

            // Update the nodes…
            node = this.svg.selectAll("g.node")
                .data(nodes, function (d) {
                    return that.options.id(d);
                });

            // Enter any new nodes at the parent's previous position.
            nodeEnter = node.enter()
                .append("g")
                .classed("node", true)
                .attr("transform", function () {
                    return "translate(" + that.orientation.xfunc(that, source[that.orientation.abscissa + "0"]) + "," + source[that.orientation.ordinate + "0"] + ")";
                })
                .on("dblclick", click);

            nodeEnter.append("circle")
                .attr("r", 1e-6)
                .classed("node", true)
                .on("mouseenter", function () {
                    d3.select(this)
                        .classed("hovering", true);
                })
                .on("mouseleave", function () {
                    d3.select(this)
                        .classed("hovering", false);
                });

            nodeEnter.append("text")
                .attr("x", 10)
                .attr("dy", ".35em")
                .attr("text-anchor", "start")
                .style("font-size", this.options.textsize + "px")
                .text(this.options.label)
                .style("fill-opacity", 1e-6);

            // Transition nodes to their new position.
            nodeUpdate = node.transition()
                .duration(this.options.duration)
                .attr("transform", function (d) {
                    return "translate(" + that.orientation.xfunc(that, d[that.orientation.abscissa]) + "," + d[that.orientation.ordinate] + ")";
                });

            nodeUpdate.select("circle")
                .attr("r", this.options.nodesize)

            nodeUpdate.select("text")
                .text(function (d) {
                    var label = that.options.label(d);
                    if (d._children || (d.children && d.showLabel)) {
                        if (label === "") {
                            label = that.options.label(firstChild(d)) + " ... " + that.options.label(lastChild(d));
                        }
                        return label + " (" + leafCount(d) + ")";
                    }
                    if (visibleLeaves < that.height / (0.8 * that.options.textsize)) {
                        return label;
                    }
                    return "";
                })
                .style("fill-opacity", 1);

            // Transition exiting nodes to the parent's new position.
            nodeExit = node
                .exit()
                .transition()
                .duration(this.options.duration)
                .attr("transform", function () {
                    return "translate(" + that.orientation.xfunc(that, source[that.orientation.abscissa]) + "," + source[that.orientation.ordinate] + ")";
                })
                .remove();

            nodeExit.select("circle")
                .attr("r", 1e-6);

            nodeExit.select("text")
                .style("fill-opacity", 1e-6);

            // Update the links…
            link = this.svg.selectAll("path.link")
                .data(links, function (d) {
                    return that.options.id(d.target);
                });

            // Enter any new links at the parent's previous position.
            link.enter()
                .insert("path", "g")
                .classed("link", true)
                .style("stroke", "black")
                .style("stroke-width", "1px")
                .style("fill", "none")
                .attr("d", function () {
                    var o = {x: source.x0, y: source.y0};
                    return that.line({source: o, target: o});
                });

            // Transition links to their new position.
            link.transition()
                .duration(this.options.duration)
                .attr("d", function (d) {
                    return that.line({source: d.source, target: d.target});
                });

            // Transition exiting nodes to the parent's new position.
            link.exit()
                .transition()
                .duration(this.options.duration)
                .attr("d", function () {
                    var o = {x: source.x, y: source.y};
                    return that.line({source: o, target: o});
                })
                .remove();

            // Stash the old positions for transition.
            nodes.forEach(function (d) {
                d.x0 = d.x;
                d.y0 = d.y;
            });

            if (this.options.initialize) {
                this.options.initialize(nodeEnter, node, nodeExit);
            }
        },

        download: function (format) {
            var node,
                s,
                d,
                str;

            if (format === "pdf") {
                node = this.svg
                    .selectAll("g.node")
                    .select("circle")
                    .attr("r", function (d) {
                        return d._children ? this.options.nodesize : 0;
                    });
                s = new window.XMLSerializer();
                d = d3.select("svg").node();
                str = s.serializeToString(d);

                // Change back to normal
                node.attr("r", this.options.nodesize);

                d3.json("/service/svg2pdf")
                    .send("POST", str, function (error, data) {
                        window.location = "/service/svg2pdf?id=" + data.result;
                    });
            } else {
                window.alert("Unsupported export format type: " + format);
            }
        },

        reset: function () {
            function unhideAll(d) {
                if (!d.children) {
                    d.children = d._children;
                    d._children = null;
                }
                if (d.children) {
                    d.children.forEach(unhideAll);
                }
            }
            unhideAll(this.options.data);
            this._setOptions({
                root: this.options.data
            });
        }
    });
}(window.tangelo, window.jQuery, window.d3));
