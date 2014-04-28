/*jslint browser: true, nomen: true, unparam: true*/

(function (tangelo, geo, d3, $) {
    'use strict';
    
    if (!($ && $.widget && d3 && geo)) {
        return;
    }
    tangelo.widget('tangelo.geojsMap', {
        options: {
            // baseLayer,
            // initial center,
            // etc.
            zoom: tangelo.accessor({value: 3})
        },
        latlng2display: function (pt) {
            return this.map.gcsToDisplay(pt);
        },
        display2latlng: function (pt) {
            return this.map.displayToGcs(pt);
        },
        svg: function () { // interactive svg layer
            return this.svgGroup;
        },
        legend: function () { // non-interactive svg on top
            throw 'Legend layer not yet implemented';
        },
        map: function () { // return the geojs map object
            return this.map;
        },
        _create: function () {
            var that = this,
                node = this.element.get(0),
                opts = {
                    zoom: this.options.zoom(),
                    node: node
                };
            this.map = geo.map(opts);
            this.map.addLayer(
                geo.osmLayer({'renderer': 'vglRenderer'}).referenceLayer(true)
            );
            this.svgLayer = geo.featureLayer({'renderer': 'd3Renderer'});
            this.map.addLayer(this.svgLayer);
            this.svgContext = this.svgLayer.renderer().canvas();
            this.svgGroup = this.svgContext.append('g').node();

            function resize() {
                var width = $(node).width(),
                    height = $(node).height();
                that.map.resize(0, 0, width, height);
                $(node).trigger('draw');
            }

            resize();
            $(window).resize(resize);
            this.map.on([geo.event.pan, geo.event.zoom], function () {
                $(node).trigger('draw');
            });
        }
    });
    /*
     * User listens to events and respondes to them as necessary.
     * To start: 'draw'... force redraw of everything,
     *    later:  more granular, zoom, pan, rotate, etc
     */
}(window.tangelo, window.geo, window.d3, window.jQuery));
