/*jslint browser: true, unparam: true, nomen: true */

(function (tangelo, $, vg) {
    "use strict";

    if (!($ && $.widget && vg)) {
        return;
    }

    tangelo.widget("tangelo.geonodelink", {
        options: {
            nodeLatitude: tangelo.accessor({value: 0}),
            nodeLongitude: tangelo.accessor({value: 0}),
            nodeSize: tangelo.accessor({value: 20}),
            nodeColor: tangelo.accessor({value: 0}),
            linkColor: tangelo.accessor({value: 0}),
            linkSource: tangelo.accessor({value: 0}),
            linkTarget: tangelo.accessor({value: 0}),
            data: null
        },

        _create: function () {
            var that = this,
                vegaspec = tangelo.vegaspec.geovis(that.options.worldGeometry);

            vg.parse.spec(vegaspec, function (chart) {
                that.vis = chart;

                that._update();
            });
        },

        _update: function () {
            var that = this;

            $.each(this.options.data.nodes, function (i, v) {
                var d = that.options.data.nodes[i];

                d.latitude = that.options.nodeLatitude(d);
                d.longitude = that.options.nodeLongitude(d);
                d.size = that.options.nodeSize(d);
                d.color = that.options.nodeColor(d);
            });

            $.each(this.options.data.links, function (i, v) {
                var d = that.options.data.links[i];

                d.color = that.options.linkColor(d);
                d.source = that.options.linkSource(d);
                d.target = that.options.linkTarget(d);
            });

            if (that.vis) {
                that.vis({
                    el: this.element.get(0),
                    data: {
                        table: that.options.data.nodes,
                        links: that.options.data.links
                    }
                }).update();
            }
        }
    });
}(window.tangelo, window.jQuery, window.vg));
