(function (tangelo, $, d3, geo, _) {
    "use strict";

    $.widget("tangelo.geojsdots", $.tangelo.geojsMap, {
        options: {
            latitude: tangelo.accessor({value: 0}),
            longitude: tangelo.accessor({value: 0}),
            size: tangelo.accessor({value: 20}),
            color: tangelo.accessor({value: 0}),
            data: null
        },

        _create: function () {
            this.colorScale = d3.scale.category10();
            this._super();
            this.element.on("rescale", _.bind(function () {
                this._rescale();
            }, this));
            this._update();
        },

        _rescale: function () {
            var scale;
            if (this.options.data && this.map()) {
                scale = this.scale();
                d3.select(this.svg())
                    .selectAll(".point")
                    .data(this.options.data)
                    .attr("r", _.bind(function (d) {
                        return tangelo.accessor(this.options.size)(d) / scale;
                    }, this));
            }
        },

        _update: function () {
            var svg = this.svg(),
                lat = tangelo.accessor(this.options.latitude),
                lng = tangelo.accessor(this.options.longitude),
                pt,
                selection,
                enter,
                exit;

            if (this.options.data && this.map()) {
                _.each(this.options.data, function (d) {
                    pt = geo.latlng(lat(d), lng(d));
                    d._georef = this.latlng2display(pt);
                }, this);
                selection = d3.select(svg).selectAll(".point").data(this.options.data);
                enter = selection.enter();
                exit = selection.exit();

                enter.append("circle")
                        .attr("class", "point");

                selection.attr("cx", tangelo.accessor({field: "_georef.x"}))
                    .attr("cy", tangelo.accessor({field: "_georef.y"}))
                    .style("fill", _.bind(function (d) {
                        return this.colorScale(this.options.color(d));
                    }, this));

                exit.remove();

                this._rescale();
            }
        }
    });
}(window.tangelo, window.jQuery, window.d3, window.geo, window._));
