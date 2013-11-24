/*jslint browser: true, unparam: true */

(function (tangelo, vg) {
    "use strict";

    tangelo.vis.geodots = function (spec) {
        var latitude,
            longitude,
            size,
            color,
            data,
            vis,
            vegaspec = spec.vegaspec,
            that = {};

        function update(spec) {
            latitude = tangelo.accessor(spec.latitude, 0);
            longitude = tangelo.accessor(spec.longitude, 0);
            size = tangelo.accessor(spec.size, 20);
            color = tangelo.accessor(spec.color, 0);
            data = spec.data;
            data.forEach(function (d) {
                d.latitude = latitude(d);
                d.longitude = longitude(d);
                d.size = size(d);
                d.color = color(d);
            });
            vis({el: spec.el, data: {table: data, links: []}}).update();
            return that;
        }

        vg.parse.spec(vegaspec, function (chart) {
            vis = chart;
            update(spec);
        });

        that.update = update;

        return that;
    };

}(window.tangelo, window.vg));
