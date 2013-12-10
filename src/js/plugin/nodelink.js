/*jslint browser: true */

(function (tangelo, $, d3) {
    "use strict";

    if (!($ && $.widget && d3)) {
        $.fn.nodelink = tangelo.unavailable({
            plugin: "nodelink",
            required: ["JQuery", "JQuery UI", "d3"]
        });
        return;
    }

    $.widget("tangelo.nodelink", {
        options: {
            nodeColor: null,
            nodeSize: null,
            nodeLabel: null,
            linkSource: null,
            linkTarget: null,
            width: 1000,
            height: 1000,
            data: null
        },

        _missing: {
            nodeColor: "steelblue",
            nodeSize: 10,
            nodeLabel: undefined,
            linkSource: 0,
            linkTarget: 0,
            width: 1000,
            height: 1000,
        },

        _create: function () {
            var options;

            this.colorScale = d3.scale.category20();

            this.options.width = this.options.width || 1000;
            this.options.height = this.options.height || 1000;

            this.force = d3.layout.force()
                .charge(-120)
                .linkDistance(30)
                .size([this.options.width, this.options.height]);

            this.svg = d3.select(this.element.get(0))
                .append("svg")
                .attr("width", this.options.width)
                .attr("height", this.options.height);

            options = $.extend(true, {}, this.options);
            delete options.disabled;
            delete options.create;
            this._setOptions(options);
        },

        _setOption: function (key, value) {
            var that = this;

            if (key !== "data" && key !== "width" && key !== "height") {
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
            var that = this,
                node,
                link;

            this.options.data.links.forEach(function (d) {
                d.source = that.options.linkSource(d);
                d.target = that.options.linkTarget(d);
            });

            this.sizeScale = d3.scale.sqrt()
                .domain(d3.extent(this.options.data.nodes, function (d) {
                    return that.options.nodeSize(d);
                }))
                .range([5, 15]);

            this.force.size([this.options.width, this.options.height])
                .nodes(this.options.data.nodes)
                .links(this.options.data.links)
                .start();

            link = this.svg.selectAll(".link")
                .data(this.options.data.links);

            link.enter()
                .append("line")
                .classed("link", true)
                .style("stroke", "black")
                .style("stroke-width", 1);

            node = this.svg.selectAll(".node")
                .data(this.options.data.nodes);

            node.enter()
                .append("circle")
                .classed("node", true)
                .call(this.force.drag)
                .append("title");

            node.attr("r", function (d) {
                    return that.sizeScale(that.options.nodeSize(d));
                })
                .style("fill", function (d) {
                    return that.colorScale(that.options.nodeColor(d));
                });

            node.selectAll("title")
                .text(function (d) {
                    return that.options.nodeLabel(d);
                });

            this.force.on("tick", function () {
                link.attr("x1", function (d) { return d.source.x; })
                    .attr("y1", function (d) { return d.source.y; })
                    .attr("x2", function (d) { return d.target.x; })
                    .attr("y2", function (d) { return d.target.y; });

                node.attr("cx", function (d) { return d.x; })
                    .attr("cy", function (d) { return d.y; });
            });

            this.force.resume();
        }
    });
}(window.tangelo, window.jQuery, window.d3));
