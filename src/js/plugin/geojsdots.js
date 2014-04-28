/*jslint browser: true, unparam: true, nomen: true*/

(function (tangelo, $, d3, geo) {
    'use strict';

    if (!($ && $.widget && d3 && geo)) {
        return;
    }

    tangelo.widget('tangelo.geojsdots', {
        options: {
            latitude: tangelo.accessor({value: 0}),
            longitude: tangelo.accessor({value: 0}),
            size: tangelo.accessor({value: 20}),
            color: tangelo.accessor({value: 0}),
            data: null
        },

        _create: function () {
            var that = this;
            this.size = tangelo.accessor(this.options.size);
            this.color = tangelo.accessor(this.options.color);
            this.lat = tangelo.accessor(this.options.latitude);
            this.lng = tangelo.accessor(this.options.longitude);
            this.element.geojsMap();
            this.svg = this.element.geojsMap('svg');
            this._update();
            this.element.on('draw', function () {
                that._update();
            });
        },

        _update: function () {
            var svg = this.svg,
                that = this,
                lat = this.lat,
                lng = this.lng,
                pt, selection, enter, exit;

            if (this.options.data) {
                this.options.data.forEach(function (d) {
                    pt = geo.latlng(lat(d), lng(d));
                    d._georef = that.element.geojsMap('latlng2display', pt)[0];
                });
                selection = d3.select(svg).selectAll('.point').data(this.options.data);
                enter = selection.enter();
                exit = selection.exit();
                
                enter.append('circle')
                        .attr('class', 'point');

                selection.attr('cx', tangelo.accessor({'field': '_georef.x'}))
                         .attr('cy', tangelo.accessor({'field': '_georef.y'}))
                         .attr('r', this.size)
                         .style('fill', this.color);

                exit.remove();
            }
        }
    });

}(window.tangelo, window.jQuery, window.d3, window.geo));
