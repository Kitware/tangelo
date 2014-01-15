/*jslint browser: true, unparam: true, nomen: true */

(function (tangelo, $, vg) {
    "use strict";

    if (!($ && $.widget && vg)) {
        $.fn.geonodelink = tangelo.unavailable({
            plugin: "geonodelink",
            required: ["JQuery", "JQuery UI", "Vega"]
        });
        return;
    }

    $.widget("tangelo.geonodelink", {
        options: {
            nodeLatitude: null,
            nodeLongitude: null,
            nodeSize: null,
            nodeColor: null,
            linkColor: null,
            linkSource: null,
            linkTarget: null,
            data: null
        },

        _missing: {
            nodeLatitude: 0,
            nodeLongitude: 0,
            nodeSize: 20,
            nodeColor: 0,
            linkColor: 0,
            linkSource: 0,
            linkTarget: 0,
            data: null
        },

        _create: function () {
            var that = this,
                vegaspec = tangelo.vegaspec.geovis(that.options.worldGeometry);

            vg.parse.spec(vegaspec, function (chart) {
                var options;

                that.vis = chart;

                options = $.extend(true, {}, that.options);
                delete options.disabled;
                delete options.create;
                delete options.worldGeometry;

                that._setOptions(options);
            });
        },

        _setOption: function (key, value) {
            if (key !== "data") {
                this._super(key, tangelo.accessor(value, this._missing[key]));
            } else {
                this._super(key, value);
            }
        },

        _setOptions: function (options) {
            var that = this,
                doUpdate = false;

            $.each(options, function (key, value) {
                that._setOption(key, value);
            });

            this._update();
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

            that.vis({
                el: this.element.get(0),
                data: {
                    table: that.options.data.nodes,
                    links: that.options.data.links
                }
            }).update();
        }
    });
}(window.tangelo, window.jQuery, window.vg));
