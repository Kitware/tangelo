(function (tangelo, $, d3) {
    "use strict";

    $.widget("tangelo.nodelink", {
        options: {
            nodeCharge:     tangelo.accessor({value: -130}),
            nodeColor:      tangelo.accessor({value: "steelblue"}),
            nodeSize:       tangelo.accessor({value: 10}),
            nodeLabel:      tangelo.accessor({value: ""}),
            nodeOpacity:    tangelo.accessor({value: 1}),
            nodeId:         tangelo.accessor({index: true}),
            linkSource:     tangelo.accessor({field: "source"}),
            linkTarget:     tangelo.accessor({field: "target"}),
            linkDistance:   tangelo.accessor({value: 30}),
            linkOpacity:    tangelo.accessor({value: 0.2}),
            nodeX:          tangelo.accessor(),
            nodeY:          tangelo.accessor(),
            width:          null,
            height:         null,
            dynamicLabels:  false,
            data:           null
        },

        _create: function () {
            this.colorScale = d3.scale.category10();

            this.force = d3.layout.force();

            this.svg = d3.select(this.element.get(0))
                .append("svg");

            this._update();
        },

        _setOptions: function (options) {
            this._super(options);
            this._update();
        },

        _update: function () {
            var that = this,
                nodeIdMap = {},
                width,
                height;

            // Fall back on the container's dimensions if not supplied to the
            // plugin.
            width = this.options.width || this.element.width();
            height = this.options.height || this.element.height();

            // Set the dimensions of the SVG element (otherwise the contents may
            // lie outside the dimensions and thus be hidden).
            this.svg.attr("width", width)
                .attr("height", height);

            if (this.options.nodeX && !this.options.nodeX.undefined) {
                this.xScale = d3.scale.linear()
                    .domain(d3.extent(this.options.data.nodes, this.options.nodeX))
                    .range([50, width - 100]);
            }

            if (this.options.nodeY && !this.options.nodeY.undefined) {
                this.yScale = d3.scale.linear()
                    .domain(d3.extent(this.options.data.nodes, this.options.nodeY))
                    .range([height - 100, 50]);
            }

            this.force.linkDistance(this.options.linkDistance)
                .charge(this.options.nodeCharge)
                .size([width, height]);

            this.options.data.nodes.forEach(function (d, i) {
                nodeIdMap[that.options.nodeId(d, i)] = d;
                d.degree = 0;
                d.outgoing = [];
                d.incoming = [];
            });

            this.options.data.links.forEach(function (d, i) {
                d.source = nodeIdMap[that.options.linkSource(d, i)];
                d.target = nodeIdMap[that.options.linkTarget(d, i)];
                d.source.degree += 1;
                d.target.degree += 1;
                d.source.outgoing.push(d.target);
                d.target.incoming.push(d.source);
            });

            this.options.data.nodes.sort(function (a, b) {
                return d3.descending(a.degree, b.degree);
            });

            this.sizeScale = d3.scale.sqrt()
                .domain(d3.extent(this.options.data.nodes, that.options.nodeSize))
                .range([5, 15]);

            this.force.size([width, height])
                .nodes(this.options.data.nodes)
                .links(this.options.data.links)
                .start();

            this.link = this.svg.selectAll(".link")
                .data(this.options.data.links);

            this.link.enter()
                .append("line")
                .classed("link", true)
                .style("opacity", this.options.linkOpacity)
                .style("stroke", "black")
                .style("stroke-width", 1);

            this.node = this.svg.selectAll(".node")
                .data(this.options.data.nodes);

            this.node.enter()
                .append("circle")
                .classed("node", true)
                .call(this.force.drag)
                .append("title");

            this.node
                .attr("r", function (d, i) {
                    return that.sizeScale(that.options.nodeSize(d, i));
                })
                .style("fill", function (d, i) {
                    return that.colorScale(that.options.nodeColor(d, i));
                })
                .style("opacity", this.options.nodeOpacity);

            this.node.selectAll("title")
                .text(this.options.nodeLabel);

            if (!that.options.dynamicLabels) {
                this.label = this.svg.selectAll("text")
                    .data(this.options.data.nodes);

                this.label.enter().append("text")
                    .text(this.options.nodeLabel);
            }

            this.force.on("tick", function () {
                that._tick(that);
            });

            this.force.resume();
        },

        _tick: function () {
            var that = this,
                nodeLabels;

            if (this.options.nodeX && !that.options.nodeX.undefined) {
                that.options.data.nodes.forEach(function (d, i) {
                    d.x = that.xScale(that.options.nodeX(d, i));
                });
            }

            if (this.options.nodeY && !that.options.nodeY.undefined) {
                that.options.data.nodes.forEach(function (d, i) {
                    d.y = that.yScale(that.options.nodeY(d, i));
                });
            }

            if (that.options.dynamicLabels) {
                nodeLabels = that._nodeLabels();

                that.svg.selectAll("text").remove();
                that.svg.selectAll("text")
                    .data(nodeLabels)
                    .enter().append("text")
                    .attr("x", function (d) {
                        return d.x;
                    })
                    .attr("y", function (d) {
                        return d.y;
                    })
                    .style("font-size", function (d) {
                        return d.count + 8;
                    })
                    .text(function (d) {
                        return d.label;
                    });
            } else {
                that.label.attr("x", function (d) {
                    return d.x;
                })
                    .attr("y", function (d) {
                        return d.y;
                    });
            }

            that.link.attr("x1", function (d) {
                return d.source.x;
            })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    return d.target.y;
                });

            that.node.attr("cx", function (d) {
                return d.x;
            })
                .attr("cy", function (d) {
                    return d.y;
                });
        },

        // Compute a list of objects of the form:
        // {
        //   count: 5    /* The number of nodes represented */
        //   label: "hi" /* A reduced label representing all nodes */
        //   x: 10
        //   y: 20       /* The x,y location to draw the label */
        // }
        // This will be a reduced set of the original node data.
        _nodeLabels: function () {
            var that = this,
                nodeLabels = [];

            that.options.data.nodes.forEach(function (d) {
                d.visited = false;
            });

            // Walk the graph, collecting connected nodes
            // close to the starting node to collapse into
            // a single label.
            that.options.data.nodes.forEach(function (d, i) {
                var count = 0,
                    labels = [],
                    label;

                function visit(dd) {
                    if (dd.visited) {
                        return;
                    }

                    if (Math.abs(dd.x - d.x) < 50 &&
                            Math.abs(dd.y - d.y) < 50) {
                        count += 1;
                        labels.push(that.options.nodeLabel(dd, i));
                        dd.visited = true;
                        dd.incoming.forEach(visit);
                        dd.outgoing.forEach(visit);
                    }
                }
                visit(d);

                if (count > 1) {
                    label = that._reduceLabels(labels);
                    nodeLabels.push({count: count, label: label, x: d.x, y: d.y});
                }
            });
            return nodeLabels;
        },

        // Reduce a collection of labels into a single label
        // using a frequent sequence of starting words.
        _reduceLabels: function (labels) {
            var label = "",
                prefixTree = {},
                word,
                maxCount,
                maxWord;

            // Build prefix tree
            labels.forEach(function (d) {
                var words, subtree = prefixTree;
                words = d.split(" ");
                while (words.length > 0) {
                    if (!subtree[words[0]]) {
                        subtree[words[0]] = {count: 0, next: {}};
                    }
                    subtree[words[0]].count += 1;
                    subtree = subtree[words[0]].next;
                    words = words.slice(1);
                }
            });

            // Traverse prefix tree for most common prefix
            while (true) {
                maxCount = 0;
                maxWord = 0;
                for (word in prefixTree) {
                    if (prefixTree.hasOwnProperty(word)) {
                        if (prefixTree[word].count > maxCount) {
                            maxCount = prefixTree[word].count;
                            maxWord = word;
                        }
                    }
                }
                if (maxCount < 2) {
                    break;
                }
                label += " " + maxWord;
                prefixTree = prefixTree[maxWord].next;
            }

            return label;
        }
    });
}(window.tangelo, window.jQuery, window.d3));
