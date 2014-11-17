/*jslint browser: true, unparam: true, nomen: true */

(function (tangelo, $, vg) {
    "use strict";

    if (!($ && $.widget && vg)) {
        return;
    }

    tangelo.widget("tangelo.geodots", {
        options: {
            latitude: tangelo.accessor({value: 0}),
            longitude: tangelo.accessor({value: 0}),
            size: tangelo.accessor({value: 20}),
            color: tangelo.accessor({value: 0}),
            worldGeometry: null,
            data: null
        },

        _create: function () {
            var that = this,
                vegaspec = tangelo.vegaspec.geovis(that.options.worldGeometry);

            this.options = $.extend(true, {}, this._defaults, this.options);

            vg.parse.spec(vegaspec, function (chart) {
                that.vis = chart;

                that._update();
            });
        },

        _update: function () {
            var that = this;

            if (this.options.data) {
                this.options.data.forEach(function (d) {
                    d.latitude = that.options.latitude(d);
                    d.longitude = that.options.longitude(d);
                    d.size = that.options.size(d);
                    d.color = that.options.color(d);
                });

                if (this.vis) {
                    this.vis({
                        el: that.element.get(0),
                        data: {
                            table: that.options.data,
                            links: []
                        }
                    }).update();
                }
            }
        }
    });
}(window.tangelo, window.jQuery, window.vg));
