(function (tangelo, $, vg) {
    "use strict";

    $.widget("tangelo.geodots", {
        options: {
            latitude: tangelo.accessor({value: 0}),
            longitude: tangelo.accessor({value: 0}),
            size: tangelo.accessor({value: 20}),
            color: tangelo.accessor({value: 0}),
            worldGeometry: null,
            data: null
        },

        _create: function () {
            var vegaspec = tangelo.plugin.mapping.geovis(this.options.worldGeometry);

            vg.parse.spec(vegaspec, _.bind(function (chart) {
                this.vis = chart;

                this._update();
            }, this));
        },

        _update: function () {
            if (this.options.data) {
                this.options.data.forEach(_.bind(function (d) {
                    d.latitude = this.options.latitude(d);
                    d.longitude = this.options.longitude(d);
                    d.size = this.options.size(d);
                    d.color = this.options.color(d);
                }, this));

                if (this.vis) {
                    this.vis({
                        el: this.element.get(0),
                        data: {
                            table: this.options.data,
                            links: []
                        }
                    }).update();
                }
            }
        }
    });
}(window.tangelo, window.jQuery, window.vg));
