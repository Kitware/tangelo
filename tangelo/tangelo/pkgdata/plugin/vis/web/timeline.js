(function (tangelo, $, d3) {
    "use strict";

    function applyTransition(s, t) {
        if (t) {
            s = s.transition(t);
        }
        return s;
    }

    $.widget("tangelo.timeline", {
        options: {
            data: [],
            x: tangelo.accessor({field: "time"}),
            y: tangelo.accessor({field: "value"}),
            margin: {
                top: 10,
                bottom: 30,
                left: 30,
                right: 30
            },
            transition: 0,
            width: null,
            height: null,
            xTicks: 10,
            yTicks: 10
        },

        _create: function () {
            this.svg = d3.select(this.element.get(0)).append("svg").attr("class", "timeline");
            this.main = this.svg.append("g");
            this.plot = this.main.append("g").attr("class", "plot");

            this.xaxis = this.main.append("g")
                            .style("font-family", "sans-serif")
                            .style("font-size", "11px");

            this.yaxis = this.main.append("g")
                            .style("font-family", "sans-serif")
                            .style("font-size", "11px");

            this.path = this.plot.append("path")
                            .style("fill", "none")
                            .style("stroke", "steelblue")
                            .style("stroke-width", "1.5px");

            this._x = null;
            this._y = null;
            $(window).resize(this._update.bind(this));
            this._update();
        },

        _setOptions: function (options) {
            this._super(options);
            this._update();
        },

        _update: function () {
            var that = this,
                axisPadding = 15,
                margin = this.options.margin,
                xAcc = tangelo.accessor(this.options.x),
                yAcc = tangelo.accessor(this.options.y),
                width = (this.options.width || this.element.width()) -
                    margin.left - margin.right - axisPadding,
                height = (this.options.height || this.element.height()) -
                    margin.top - margin.bottom - axisPadding,
                data = this.options.data,
                xaxis,
                yaxis,
                line;

            this._x = d3.time.scale()
                .domain(d3.extent(data, function (d) {
                    return new Date(xAcc(d));
                }))
                .range([0, width])
                .nice();
            this._y = d3.scale.linear()
                .domain(d3.extent(data, function (d) {
                    var val = yAcc(d);
                    if (_.isNumber(val) && !isNaN(val)) {
                        return val;
                    }
                    return undefined;
                }))
                .range([height, 0])
                .nice();

            xaxis = d3.svg.axis()
                .scale(this._x)
                .orient("bottom");
            xaxis.ticks(this.options.xTicks);
            yaxis = d3.svg.axis()
                .scale(this._y)
                .orient("left");
            yaxis.ticks(this.options.yTicks);

            line = d3.svg.line()
                .x(function (d) {
                    return that._x(new Date(xAcc(d)));
                })
                .y(function (d) {
                    return that._y(yAcc(d));
                })
                .defined(function (d) {
                    var val = that._y(yAcc(d));
                    return _.isNumber(val) && !isNaN(val);
                });

            // resize svg
            this.svg
                .attr("width", width + margin.left + margin.right + axisPadding)
                .attr("height", height + margin.top + margin.bottom + axisPadding);
            this.main
                .attr("transform", "translate(" + (margin.left + axisPadding) + "," + margin.top + ")");

            // generate axes
            applyTransition(this.xaxis, this.options.transition)
                .attr("transform", "translate(0," + height + ")")
                .call(xaxis);
            applyTransition(this.yaxis, this.options.transition)
                .call(yaxis);

            function styleLine(selection) {
                selection
                    .style("fill", "none")
                    .style("stroke", "black")
                    .style("stroke-width", "1px")
                    .style("shape-rendering", "crispEdges");
            }

            this.xaxis.selectAll("path").call(styleLine);
            this.xaxis.selectAll("line").call(styleLine);
            this.yaxis.selectAll("path").call(styleLine);
            this.yaxis.selectAll("line").call(styleLine);

            // generate the plot
            applyTransition(this.path, this.options.transition)
                .attr("d", line(this.options.data));
        },

        xScale: function () {
            return this._x;
        },

        yScale: function () {
            return this._y;
        }
    });
}(window.tangelo, window.jQuery, window.d3));
