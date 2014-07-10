/*jslint browser: true, nomen: true, unparam: true*/

(function (tangelo, $, d3) {
    "use strict";

    if (!($ && $.widget && d3)) {
        return;
    }

    tangelo.widget('tangelo.histogram', $.tangelo.plotbase, {
        options: {
            x: tangelo.accessor({'field': 'value'}),
            nBins: 10
        },

        _pushOptions: function () {
            // push custom options for super class methods
            this._saved = {
                data: this.options.data,
                x: this.options.x,
                y: this.options.y
            };
            this.options.x = {'field': 'value'};
            this.options.y = {'field': 'count'};
            this.options.data = this._bins;
        },

        _popOptions: function () {
            // revert options to the user set values
            this.options.data = this._saved.data;
            this.options.x = this._saved.x;
            this.options.y = this._saved.y;
        },

        _create: function () {
            this._bins = [];
            this._created = false;

            this._pushOptions();
            this._super();
            this._popOptions();

            this._created = true;
            this._update();
        },

        _update: function () {
            var selection, enter, exit, x, y;

            if (!this._created) {
                return;
            }
            this._binData();

            this._pushOptions();
            this._super();
            this._popOptions();

            x = this.xScale();
            y = this.yScale();

            selection = this.plot.selectAll('.boxes').data(this._bins.slice(0, this._bins.length - 2));
            enter = selection.enter();
            exit = selection.exit();

            enter.append('rect')
                .attr('class', 'boxes')
                .attr('x', function (d) {
                    return x(d.min);
                })
                .attr('y', y(0))
                .attr('width', function (d) {
                    return x(d.max) - x(d.min);
                })
                .attr('height', 0);

            selection
                .attr('x', function (d) {
                    return x(d.min);
                })
                .attr('width', function (d) {
                    return x(d.max) - x(d.min);
                });

            // transition only the vertical component of the boxes
            this._applyTransition(selection, this.options.transition)
                .attr('y', function (d) {
                    return y(d.count);
                })
                .attr('height', function (d) {
                    return y(0) - y(d.count);
                });

            exit.remove();
        },

        _plotClass: function () {
            return 'histogram';
        },

        _binData: function () {
            var x_ext, dx, N, i, xAcc, that = this;

            // clear out the old bins while keeping the reference
            while (this._bins.length > 0) {
                this._bins.pop();
            }

            if (!this.options.data.length) {
                return;
            }

            xAcc = tangelo.accessor(this.options.x);
            x_ext = d3.extent(this.options.data, xAcc);
            N = this.options.nBins;

            dx = (x_ext[1] - x_ext[0]) / N;

            if (dx <= 0) {
                dx = 1;
            }

            // create the bins
            for (i = 0; i < N; i += 1) {
                this._bins.push({
                    min: i * dx + x_ext[0],
                    max: (i + 1) * dx + x_ext[0],
                    value: i * dx / 2 + x_ext[0],
                    count: 0
                });
            }

            // add two dummy bins to initialize the scale in the
            // super class update
            this._bins.push({
                value: x_ext[0],
                count: 0
            });
            this._bins.push({
                value: x_ext[1],
                count: 0
            });

            // accumulate the data
            this.options.data.forEach(function (d) {
                var val, bin;

                val = xAcc(d);
                bin = (val - x_ext[0]) / dx;

                if (bin >= 0 && bin < N + dx / 1000) {
                    // make sure the val === x_ext[1] gets in the largest bin
                    if (bin >= N) {
                        bin = N - 1;
                    }
                    bin = Math.floor(bin);
                    that._bins[bin].count += 1;
                }

            });

        }
    });

}(window.tangelo, window.jQuery, window.d3));
