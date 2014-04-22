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
            transition: 0
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
        },

        _update: function () {
            var axisPadding = 15,
                padding = this.options.padding,
                xAcc = tangelo.accessor(this.options.x),
                yAcc = tangelo.accessor(this.options.y),
                width = this.element.width() - 2 * padding - axisPadding,
                height = this.element.height() - 2 * padding - axisPadding,
                data = this.options.data,
                x = d3.time.scale()
                    .domain(d3.extent(data, xAcc))
                    .range([0, width])
                    .nice(),
                y = d3.scale.linear()
                    .domain(d3.extent(data, yAcc))
                    .range([height, 0])
                    .nice(),
                xaxis = d3.svg.axis()
                    .scale(x)
                    .orient('bottom'),
                yaxis = d3.svg.axis()
                    .scale(y)
                    .orient('left'),
                line = d3.svg.line()
                    .x(function (d) {
                        return x(xAcc(d));
                    })
                    .y(function (d) {
                        return y(yAcc(d));
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
        }

    });

}(window.tangelo, window.jQuery, window.d3));
