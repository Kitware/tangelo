/*jslint browser: true, nomen: true, unparam: true*/

(function (tangelo, $, d3) {
    "use strict";

    if (!($ && $.widget && d3)) {
        return;
    }

    tangelo.widget('tangelo.timeline', $.tangelo.plotbase, {
        options: {
            x: tangelo.accessor({'field': 'time'}),
            y: tangelo.accessor({'field': 'value'}),
            xScale: d3.time.scale()
        },

        _create: function () {
            this._super();
            this.path = this.plot.append('path')
                            .attr('class', 'path');
        },

        _update: function () {
            var line, that, xAcc, yAcc;

            if (this.path) {

                this._super();

                that = this;
                xAcc = tangelo.accessor(this.options.x);
                yAcc = tangelo.accessor(this.options.y);

                line = d3.svg.line()
                    .x(function (d) {
                        return that._x(xAcc(d));
                    })
                    .y(function (d) {
                        return that._y(yAcc(d));
                    });

                // generate the plot
                this._applyTransition(this.path, this.options.transition)
                    .attr('d', line(this.options.data));
            }
        },

        _plotClass: function () {
            return 'timeline';
        }
    });

}(window.tangelo, window.jQuery, window.d3));
