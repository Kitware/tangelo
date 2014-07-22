/*jslint browser: true, unparam: true, nomen: true */

(function (tangelo, $, d3, geo) {
    'use strict';

    if (!($ && $.widget && d3 && geo)) {
        return;
    }

    tangelo.widget('tangelo.geojsdots', $.tangelo.geojsMap, {
        options: {
            latitude: tangelo.accessor({value: 0}),
            longitude: tangelo.accessor({value: 0}),
            size: tangelo.accessor({value: 20}),
            color: tangelo.accessor({value: 0}),
            data: null
        },

        _create: function () {
            var that = this;
            this.colorScale = d3.scale.category10();
            this._super();
            this.element.on('rescale', function () {
                that._rescale();
            });
        },

        _rescale: function () {
            var that = this,
                scale;
            if (this.options.data && this.map()) {
                scale = this.scale();
                d3.select(this.svg())
                    .selectAll('.point')
                    .data(this.options.data)
                    .attr('r', function (d) {
                        return tangelo.accessor(that.options.size)(d) / scale;
                    });
            }
        },

        _update: function () {
            var svg = this.svg(),
                that = this,
                lat = tangelo.accessor(this.options.latitude),
                lng = tangelo.accessor(this.options.longitude),
                pt,
                selection,
                enter,
                exit;

            if (this.options.data && this.map()) {
                this.options.data.forEach(function (d) {
                    pt = geo.latlng(lat(d), lng(d));
                    d._georef = that.latlng2display(pt);
                });
                selection = d3.select(svg).selectAll('.point').data(this.options.data);
                enter = selection.enter();
                exit = selection.exit();

                enter.append('circle')
                        .attr('class', 'point');

                selection.attr('cx', tangelo.accessor({'field': '_georef.x'}))
                    .attr('cy', tangelo.accessor({'field': '_georef.y'}))
                    .style('fill', function (d) {
                        return that.colorScale(
                            tangelo.accessor(that.options.color)(d)
                        );
                    });

                exit.remove();

                this._rescale();
            }
        }
    });
}(window.tangelo, window.jQuery, window.d3, window.geo));
