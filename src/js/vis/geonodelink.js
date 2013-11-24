/*jslint browser: true, unparam: true */

(function (tangelo, d3, vg) {
    "use strict";

    tangelo.vis.geonodelink = function (spec) {
        var nodeLatitude = tangelo.accessor(spec.nodeLatitude, 0),
            nodeLongitude = tangelo.accessor(spec.nodeLongitude, 0),
            nodeSize = tangelo.accessor(spec.nodeSize, 20),
            nodeColor = tangelo.accessor(spec.nodeColor, 0),
            linkColor = tangelo.accessor(spec.linkColor, 0),
            linkSource = tangelo.accessor(spec.linkSource, 0),
            linkTarget = tangelo.accessor(spec.linkTarget, 0),
            vegaspec = spec.vegaspec,
            data = spec.data,
            that = {};

        data.nodes.forEach(function (d) {
            d.latitude = nodeLatitude(d);
            d.longitude = nodeLongitude(d);
            d.size = nodeSize(d);
            d.color = nodeColor(d);
        });
        data.links.forEach(function (d) {
            d.color = linkColor(d);
            d.source = linkSource(d);
            d.target = linkTarget(d);
        });
        vg.parse.spec(vegaspec, function (chart) {
            chart({el: spec.el, data: {table: data.nodes, links: data.links}}).update();
        });

        function update(spec) {
            return that;
        }

        that.update = update;
        return that;
    };

}(window.tangelo, window.d3, window.vg));
