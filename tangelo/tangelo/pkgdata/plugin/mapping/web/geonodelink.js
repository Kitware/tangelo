(function (tangelo, $, vg, _) {
    "use strict";

    $.widget("tangelo.geonodelink", {
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
                vegaspec = tangelo.plugin.mapping.geovis(that.options.worldGeometry);

            vg.parse.spec(vegaspec, function (chart) {
                that.vis = chart;

                that._update();
            });
        },

        _update: function () {
            $.each(this.options.data.nodes, _.bind(function (i) {
                var d = this.options.data.nodes[i];

                d.latitude = this.options.nodeLatitude(d);
                d.longitude = this.options.nodeLongitude(d);
                d.size = this.options.nodeSize(d);
                d.color = this.options.nodeColor(d);
            }, this));

            $.each(this.options.data.links, _.bind(function (i) {
                var d = this.options.data.links[i];

                d.color = this.options.linkColor(d);
                d.source = this.options.linkSource(d);
                d.target = this.options.linkTarget(d);
            }, this));

            if (this.vis) {
                this.vis({
                    el: this.element.get(0),
                    data: {
                        table: this.options.data.nodes,
                        links: this.options.data.links
                    }
                }).update();
            }
        }
    });
}(window.tangelo, window.jQuery, window.vg, window._));
