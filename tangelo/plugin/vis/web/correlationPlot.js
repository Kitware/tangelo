(function (tangelo, d3, $) {
    "use strict";

    /*
     * Class defining a single scatter plot to be used internally by
     * CorrelationPlotter.
     */
    function CorrelationSubPlot(options) {
        options = options || {};

        var that = this,
            node = options.node,
            svg = d3.select(options.node)
                    .append("g"),
            rect =  svg.append("rect")
                        .attr("class", "axis")
                        .attr("x", 0)
                        .attr("y", 0)
                        .style("fill", "none");

        // the x coordinate accessor
        this.x = options.x;

        // the y coordinate accessor
        this.y = options.y;

        // the width of the subplot
        this.width = options.width;

        // the height of the subplot
        this.height = options.height;

        // the data to be plotted
        this.data = options.data || [];

        // the indexing function for the data
        this.idx = options.idx || undefined;

        // the radius of the points
        this.radius = options.radius || "3pt";

        // the color of the points
        this.color = options.color || undefined;

        // the main draw function
        this.draw = function () {
            if (!(that.x && that.y)) {
                throw "x and y accessors are not set";
            }
            var padding = options.padding || 7.5,
                width = Math.max((that.width || $(node).width()) - 2 * padding, 0),
                height = Math.max((that.height || $(node).height()) - 2 * padding, 0),
                xAx = d3.scale.linear().range([0, width]).domain([0, 1]),
                yAx = d3.scale.linear().range([height, 0]).domain([0, 1]),
                opacity = options.opacity || 1,
                duration = options.duration || 0,
                selection;

            // translate the subplot for proper padding
            svg.attr("transform", "translate(" + padding + "," + padding + ")");

            // set the width/height
            rect.attr("width", width)
                .attr("height", height);

            // create the data join on the selection
            selection = svg.selectAll(".point")
                                .data(that.data, that.idx);

            // append circles on enter
            selection.enter()
                .append("circle")
                    .attr("class", "point")
                    .attr("cx", function (d) {
                        return xAx(that.x(d));
                    })
                    .attr("cy", function (d) {
                        return yAx(that.y(d));
                    })
                    .attr("r", that.radius)
                    .style({
                        "fill-opacity": 0,
                        "stroke-opacity": 0
                    });

            // remove circles on exit
            selection.exit()
                .remove();

            // add a transition if requested
            if (duration) {
                selection = selection
                    .transition()
                        .duration(duration);
            }

            // set color if requested
            if (that.color) {
                selection.style("fill", that.color);
            }

            // reposition and restyle the points on every refresh
            selection
                .attr("cx", function (d) {
                    return xAx(that.x(d));
                })
                .attr("cy", function (d) {
                    return yAx(that.y(d));
                })
                .attr("r", that.radius)
                .style({
                    "fill-opacity": opacity,
                    "stroke-opacity": opacity
                });
            return this;
        };
    }

    /*
     * The main class that creates tiles of CorrelationSubPlot
     * scatter plots.
     */
    function CorrelationPlotter(options) {
        options = options || {};
        var that = this,
            node = options.node,
            svgC = d3.select(node).append("svg")
                        .attr("class", "correlationPlot"),
            svg = svgC.append("g");

        // accessors to the variables to be displayed
        // these function should return values in [0, 1]
        // and have the property label defined to a
        // a string
        this.variables = options.variables || [];

        // the data to be displayed
        this.data = options.data || [];

        // the global display size if static
        // otherwise the size is computed from
        // the node size
        this.width = options.width;
        this.height = options.height;

        // an internal cache of the subplot objects
        this.plots = {};

        // the main draw function
        this.draw = function () {
            if (!that.variables.length) {
                return;
            }

            var full = options.full,
                padding = options.padding || 10,
                offset = 15,
                oWidth = that.width || $(node).width(),
                oHeight = that.height || $(node).height(),
                rWidth = Math.min(oWidth, oHeight),
                width = rWidth - 2 * padding - offset,
                height = rWidth - 2 * padding - offset,
                eWidth = (oWidth - rWidth) / 2,
                eHeight = (oHeight - rWidth) / 2,
                nvars = that.variables.length,
                nblocks = nvars - (full ? 0 : 1),
                sWidth = width / nblocks,
                sHeight = height / nblocks,
                plotSelection,
                table = [],
                xlabels, ylabels;

            // set the global plot size
            svgC
                .attr("width", oWidth)
                .attr("height", oHeight);

            // translate the main plot group for padding
            svg.attr("transform", "translate(" + (padding + eWidth + offset) + "," + (padding + eHeight + offset) + ")");

            // create the variable correlation table
            that.variables.forEach(function (d) {
                that.variables.forEach(function (e) {
                    table.push({
                        x: e,
                        y: d,
                        id: e.label + "-" + d.label
                    });
                });
            });

            // add axis labels
            xlabels = svg.selectAll(".xlabel")
                    .data(that.variables.slice(0, nblocks));
            xlabels.enter()
                .append("text")
                    .attr("class", "xlabel")
                    .attr("text-anchor", "middle");
            xlabels.exit().remove();
            xlabels
                    .attr("x", function (d, i) {
                        return (i + 0.5) * sWidth;
                    })
                    .attr("y", -offset / 2)
                    .text(function (d) {
                        return d.label;
                    });
            ylabels = svg.selectAll(".ylabel")
                .data(full ? that.variables : that.variables.slice(1));
            ylabels.enter()
                .append("text")
                    .attr("class", "ylabel")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("text-anchor", "middle");
            ylabels.exit().remove();
            ylabels
                    .attr("transform", function (d, i) {
                        var cx = -offset / 2,
                            cy = (nblocks - i - 0.5) * sWidth;
                        return "translate(" + cx + "," + cy + ") rotate(-90)";
                    })
                    .text(function (d) {
                        return d.label;
                    });

            // the main data join for the plot windows
            plotSelection = svg.selectAll(".subPlot")
                    .data(table, function (d) {
                        return d.id;
                    });

            // on enter create a new group element and initialize
            // a subplot object in the cache
            plotSelection.enter()
                .append("g")
                    .attr("class", "subPlot")
                .each(function (d, i) {
                    var x = i % nvars,
                        y = nvars - 1 - Math.floor(i / nvars);
                    if (full || x + y < nvars - 1) {
                        that.plots[d.id] = new CorrelationSubPlot({
                            width: sWidth,
                            height: sHeight,
                            node: this,
                            x: d.x,
                            y: d.y,
                            color: options.color
                        });
                    } else {
                        that.plots[d.id] = {
                            draw: function () {
                                return null;
                            }
                        };
                    }
                });
            plotSelection.exit().remove();

            // apply translation to put the subplot
            // in the correct position
            plotSelection
                    .attr("transform", function (d, i) {
                        var x = i % nvars,
                            y = nvars - 1 - Math.floor(i / nvars);
                        return "translate(" + (x * sWidth) + "," + (y * sHeight) + ")";
                    });

            // set the size and data in the subplot
            // and trigger a redraw
            plotSelection.each(function (d) {
                var plot = that.plots[d.id];
                plot.width = sWidth;
                plot.height = sHeight;
                plot.data = that.data;
                plot.draw();
            });
        };
    }

    $.widget("tangelo.correlationPlot", {
        options: {
            variables: [],
            data: [],
            padding: 10,
            color: tangelo.accessor({value: "steelblue"}),
            full: false,
            width: null,
            height: null
        },
        _create: function () {
            this.obj = new CorrelationPlotter($.extend({node: this.element.get(0)}, this.options));
            this.element.on("draw", this.obj.draw);
        },
        _update: function () {
            $.extend(this.obj, this.options);
            this.obj.draw();
        },
        variables: function (v) {
            this.obj.variables = v;
        },
        data: function (d) {
            this.obj.data = d;
        }
    });
}(window.tangelo, window.d3, window.jQuery));
