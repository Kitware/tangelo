/*jslint browser: true, nomen: true, unparam: true*/

(function (tangelo, $, d3) {
    "use strict";

    if (!($ && $.widget && d3)) {
        return;
    }

    function applyTransition(s, t) {
        if (t) {
            s = s.transition(t);
        }
        return s;
    }

    tangelo.widget('tangelo.timeline', {
        options: {
            data: [],
            x: tangelo.accessor({'field': 'time'}),
            y: tangelo.accessor({'field': 'value'}),
            padding: 30,
            transition: 0,
            width: null,
            height: null
        },

        _create: function () {
            this.svg = d3.select(this.element.get(0)).append('svg').attr('class', 'timeline');
            this.main = this.svg.append('g');
            this.plot = this.main.append('g').attr('class', 'plot');
            this.xaxis = this.main.append('g')
                            .attr('class', 'x-axis axis');
            this.yaxis = this.main.append('g')
                            .attr('class', 'y-axis axis');
            this.path = this.plot.append('path')
                            .attr('class', 'path');
            this._x = null;
            this._y = null;
        },

        _update: function () {
            var that = this,
                axisPadding = 15,
                padding = this.options.padding,
                xAcc = tangelo.accessor(this.options.x),
                yAcc = tangelo.accessor(this.options.y),
                width = (this.options.width || this.element.width()) - 2 * padding - axisPadding,
                height = (this.options.height || this.element.height()) - 2 * padding - axisPadding,
                data = this.options.data,
                xaxis,
                yaxis,
                line;

            this._x = d3.time.scale()
                .domain(d3.extent(data, xAcc))
                .range([0, width])
                .nice();
            this._y = d3.scale.linear()
                .domain(d3.extent(data, yAcc))
                .range([height, 0])
                .nice();

            xaxis = d3.svg.axis()
                .scale(this._x)
                .orient('bottom');
            yaxis = d3.svg.axis()
                .scale(this._y)
                .orient('left');

            line = d3.svg.line()
                .x(function (d) {
                    return that._x(xAcc(d));
                })
                .y(function (d) {
                    return that._y(yAcc(d));
                });

            // resize svg
            this.svg
                .attr('width', width + 2 * padding + axisPadding)
                .attr('height', height + 2 * padding + axisPadding);
            this.main
                .attr('transform', 'translate(' + (padding + axisPadding) + ',' + padding + ')');

            // generate axes
            applyTransition(this.xaxis, this.options.transition)
                .attr('transform', 'translate(0,' + height + ')')
                .call(xaxis);
            applyTransition(this.yaxis, this.options.transition)
                .call(yaxis);

            // generate the plot
            applyTransition(this.path, this.options.transition)
                .attr('d', line(this.options.data));
        },

        xScale: function () {
            return this._x;
        },

        yScale: function () {
            return this._y;
        }
    });

}(window.tangelo, window.jQuery, window.d3));
