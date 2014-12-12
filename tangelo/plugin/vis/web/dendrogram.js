(function (tangelo, $, d3) {
    "use strict";

    if (!d3.selection.prototype.moveToFront) {
        d3.selection.prototype.moveToFront = function () {
            return this.each(function () {
                this.parentNode.appendChild(this);
            });
        };
    }

    var _id = 0,
        toggleExpand = function (d) {
            d.collapse = !d.collapse;
        },
        getChildren = function (d) {
            if (!d.collapse) {
                return d._children;
            }
            return [];
        },
        getID = function (d) {
            if (!d._treeID) {
                _id += 1;
                d._treeID = _id;
            }
            return d._treeID;
        };

    function findSource(d) {
        if (!d.parent || !d._treeNew) {
            return d;
        }
        return findSource(d.parent);
    }

    function findSink(d) {
        if (!d.parent || !d._treeOld) {
            return d;
        }
        return findSink(d.parent);
    }

    $.widget("tangelo.dendrogram", {
        options: {
            // accessor to the node label
            label: tangelo.accessor({value: ""}),
            // accessor to a unique node id
            id: getID,
            // margin spacing
            margin: {
                top: 35,
                right: 25,
                bottom: 25,
                left: 25
            },
            // graph size in pixels or null to use the element size
            width: null,
            height: null,
            // transition duration
            duration: 750,
            // the tree root
            data: {},
            // accessor to node colors
            nodeColor: tangelo.accessor({value: "lightsteelblue"}),
            // accessor to font size of the labels
            labelSize: tangelo.accessor({value: "14px"}),
            // accessor to line stroke width
            lineWidth: tangelo.accessor({value: 1}),
            // accessor to line stroke color
            lineColor: tangelo.accessor({value: "black"}),
            // line style: curved or axisAligned
            lineStyle: "curved",
            // accessor to node circle radius
            nodeSize: tangelo.accessor({value: 5}),
            // event callbacks
            on: {
                click: function () {
                    return true;
                }
            },
            // accessor telling if the given node should be expanded
            // or collapsed
            expanded: function (d) {
                return !d.collapse;
            },
            // accessor to the label position
            // should return "above" or "below"
            labelPosition: tangelo.accessor({value: "above"}),
            // graph orientation: "vertical" or "horizontal"
            orientation: "vertical"
        },
        walk: function (f, root, all) {
            // call the function "f" on all nodes starting from root
            // root defaults to the tree root
            // if all === true, then traverse all nodes, not just the visible nodes
            var children, that = this;
            root = root || this.options.data;
            f(root);
            children = all ? root._children : root.children;
            children.forEach(function (c) {
                if (c) { // make sure we don't end up in an infinite loop
                    that.walk(f, c, all);
                }
            });
        },
        _create: function () {
            this.svg = d3.select(this.element.get(0)).append("svg");
            this.group = this.svg.append("g");
            this._update();
        },
        _destroy: function () {
            this.svg.remove();
        },
        _transition: function (selection) {
            // helper function to apply a transition to the
            // selection if duration is truthy
            if (this.options.duration) {
                selection = selection.transition()
                                .duration(this.options.duration);
            }
            return selection;
        },
        resize: function () {
            // resize the svg, temporarily turns of transitions
            // then calls update
            var duration = this.options.duration;
            this.options.duration = null;
            this._update();
            this.options.duration = duration;
        },
        _update: function () {
            var that = this, width, height, sw, sh,
                tree = d3.layout.tree(),
                line,
                id = tangelo.accessor(this.options.id),
                selection, enter, exit, nodes, vert = this.options.orientation === "vertical",
                rotString = "", tmp, h,
                ml = this.options.margin.left, mt = this.options.margin.top,
                mr = this.options.margin.right, mb = this.options.margin.bottom;

            // get the total size of the content
            width = (this.options.width || this.element.width());
            height = (this.options.height || this.element.height());
            sw = width;
            sh = height;

            if (!vert) {
                // for horizontal layout, we apply a rotation
                // to the main svg group
                h = height - mb;
                tmp = width;
                width = height;
                height = tmp;
                rotString = "translate(" + ml + "," + h + ") " + "rotate(-90) ";
                mt = this.options.margin.right;
                mb = this.options.margin.left;
                ml = this.options.margin.top;
                mr = this.options.margin.bottom;
            } else {
                rotString = "translate(" + ml + "," + mt + ")";
            }

            // set the svg size
            this.svg.attr("width", sw)
                    .attr("height", sh);

            // get size without margins
            width -= ml + mr;
            height -= mt + mb;

            // apply rotations/translations
            this.group.attr("transform", rotString);

            // save the old children array and positions for all nodes
            this.walk(function (d) {
                d._children = (d._children || d.children) || [];
                d.x0 = d.x === undefined ? width / 2 : d.x;
                d.y0 = d.y === undefined ? height / 2 : d.y;
            }, this.options.data, true);

            // set the graph size and children accessor
            tree.size([width, height])
                .children(getChildren);

            nodes = tree(this.options.data);

            // select the node links
            selection = this.group.selectAll(".line")
                .data(tree.links(nodes), function (d) {
                    return id(d.target);
                });

            enter = selection.enter();
            exit = selection.exit();

            // Reset flags that keep track of which nodes
            // are new in this selection, and which are
            // being removed.  These flags determine the
            // source and sink values for transition effects.
            selection.each(function (d) {
                d.target._treeOld = false;
                d.target._treeNew = false;
            });
            exit.each(function (d) {
                d.target._treeOld = true;
            });

            // create the line generator according to the line style
            if (this.options.lineStyle === "curved") {
                line = d3.svg.diagonal();
            } else if (this.options.lineStyle === "axisAligned") {
                line = function (obj) {
                    var l = d3.svg.line().interpolate("step-before")
                                .x(tangelo.accessor({field: "x"}))
                                .y(tangelo.accessor({field: "y"}));
                    return l([obj.source, obj.target]);
                };
            } else {
                throw new Error("illegal option for lineStyle: " + this.options.lineStyle);
            }

            // append new paths
            enter.append("path")
                .attr("class", "line tree")
                .each(function (d) {
                    d.target._treeNew = true;
                })
                .attr("d", function (d) {
                    var s = findSource(d.target),
                        t = {x: s.x0, y: s.y0};
                    return line({
                        source: t,
                        target: t
                    });
                })
                .style("stroke-opacity", 1e-6)
                .style("stroke", this.options.lineColor)
                .style("stroke-width", this.options.lineWidth)
                .style("fill", "none");

            exit = this._transition(exit);
            exit
                .attr("d", function (d) {
                    var s = findSink(d.target);
                    return line({
                        source: s,
                        target: s
                    });
                })
                .style("stroke-opacity", 1e-6)
                .remove();

            selection = this._transition(selection);
            selection
                .attr("d", line)
                .style("stroke-opacity", 1)
                .style("stroke", this.options.lineColor)
                .style("stroke-width", this.options.lineWidth);

            // determine if we need to rotate the labels or not
            // according to the tree orientation
            rotString = "";
            if (!vert) {
                rotString = "rotate(90)";
            }

            // select the node labels
            selection = this.group.selectAll(".label")
                                .data(nodes, id);
            enter = selection.enter();
            exit = selection.exit();

            enter.append("text")
                .attr("class", "label tree")
                .attr("dy", function (d, i) {
                    var pos = that.options.labelPosition(d, i),
                        val;
                    if (pos === "above") {
                        val = "-0.8em";
                    } else if (pos === "below") {
                        val = "1.35em";
                    } else {
                        throw new Error("Invalid labelPosition");
                    }
                    return val;
                })
                .attr("transform", function (d) {
                    var s = findSource(d);
                    return "translate(" + s.x0 + "," + s.y0 + ")" + rotString;
                })
                .attr("text-anchor", "middle")
                .attr("font-size", this.options.labelSize)
                .style("fill-opacity", 1e-6)
                .text(this.options.label);

            exit = this._transition(exit);
            exit
                .attr("transform", function (d) {
                    var s = findSink(d);
                    return "translate(" + s.x + "," + s.y + ")" + rotString;
                })
                .style("fill-opacity", 1e-6)
                .attr("font-size", this.options.labelSize)
                .text(this.options.label)
                .remove();

            selection = this._transition(selection);
            selection
                .attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")" + rotString;
                })
                .attr("font-size", this.options.labelSize)
                .style("fill-opacity", 1)
                .text(this.options.label);

            // select the nodes
            selection = this.group.selectAll(".node")
                                .data(nodes, id);

            enter = selection.enter();
            exit = selection.exit();

            enter.append("circle")
                .attr("class", "node tree")
                .attr("cx", function (d) {
                    return findSource(d).x0;
                })
                .attr("cy", function (d) {
                    return findSource(d).y0;
                })
                .attr("r", this.options.nodeSize)
                .style("fill", this.options.nodeColor)
                .style("fill-opacity", 1e-6)
                .style("stroke-opacity", 1e-6)
                .on("click", function (d) {
                    that.options.sinkNode = {value: d};
                    that.options.sourceNode = {value: d};
                    if (that.options.on.click.apply(this, arguments)) {
                        toggleExpand.apply(this, arguments);
                    }
                    that._update();
                });

            exit = this._transition(exit);
            exit
                .attr("cx", function (d) {
                    return findSink(d).x;
                })
                .attr("cy", function (d) {
                    return findSink(d).y;
                })
                .attr("r", this.options.nodeSize)
                .style("fill-opacity", 1e-6)
                .style("stroke-opacity", 1e-6)
                .remove();

            // bring the nodes in front of the links
            selection.moveToFront();
            selection = this._transition(selection);
            selection
                .attr("cx", function (d) {
                    return d.x;
                })
                .attr("cy", function (d) {
                    return d.y;
                })
                .attr("r", this.options.nodeSize)
                .style("fill-opacity", 1)
                .style("stroke-opacity", 1)
                .style("fill", this.options.nodeColor);
        }
    });
}(window.tangelo, window.jQuery, window.d3));
