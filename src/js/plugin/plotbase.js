/*jslint browser: true, nomen: true, unparam: true*/

(function (tangelo, $, d3) {
    "use strict";

    if (!($ && $.widget && d3)) {
        return;
    }


    tangelo.widget('tangelo.plotbase', {
        options: {
            data: [],
            x: tangelo.accessor({'field': 'x'}),
            y: tangelo.accessor({'field': 'y'}),
            xScale: null,
            yScale: null,
            margin: {
                top: 10,
                bottom: 30,
                left: 30,
                right: 10
            },
            transition: 0,
            width: null,
            height: null,
            xTicks: 10,
            yTicks: 10
        },

        _create: function () {
            this.svg = d3.select(this.element.get(0))
                            .append('svg')
                                .attr('class', this._plotClass());
            this.main = this.svg.append('g');
            this.plot = this.main.append('g').attr('class', 'plot');
            this.xaxis = this.main.append('g')
                            .attr('class', 'x-axis axis');
            this.yaxis = this.main.append('g')
                            .attr('class', 'y-axis axis');
            this._x = null;
            this._y = null;
        },

        _update: function () {
            var axisPadding = 15,
                margin = this.options.margin,
                xAcc = tangelo.accessor(this.options.x),
                yAcc = tangelo.accessor(this.options.y),
                width = (this.options.width || this.element.width()) -
                    margin.left - margin.right - axisPadding,
                height = (this.options.height || this.element.height()) -
                    margin.top - margin.bottom - axisPadding,
                data = this.options.data,
                xaxis,
                yaxis;

            this._x = (this.options.xScale || d3.scale.linear())
                .domain(d3.extent(data, xAcc))
                .range([0, width])
                .nice();
            this._y = (this.options.yScale || d3.scale.linear())
                .domain(d3.extent(data, yAcc))
                .range([height, 0])
                .nice();

            xaxis = d3.svg.axis()
                .scale(this._x)
                .orient('bottom');
            xaxis.ticks(this.options.xTicks);
            yaxis = d3.svg.axis()
                .scale(this._y)
                .orient('left');
            yaxis.ticks(this.options.yTicks);

            // resize svg
            this.svg
                .attr('width', width + margin.left + margin.right + axisPadding)
                .attr('height', height + margin.top + margin.bottom + axisPadding);
            this.main
                .attr('transform', 'translate(' + (margin.left + axisPadding) + ',' + margin.top + ')');

            // generate axes
            this._applyTransition(this.xaxis, this.options.transition)
                .attr('transform', 'translate(0,' + height + ')')
                .call(xaxis);
            this._applyTransition(this.yaxis, this.options.transition)
                .call(yaxis);
        },

        xScale: function () {
            return this._x;
        },

        yScale: function () {
            return this._y;
        },

        _applyTransition: function (s, t) {
            if (t) {
                s = s.transition(t);
            }
            return s;
        },

        _plotClass: function () {
            return 'plotbase';
        }
    });

}(window.tangelo, window.jQuery, window.d3));
