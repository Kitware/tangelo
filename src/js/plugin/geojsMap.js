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
            zoom: 3,
            width: null,
            heigth: null
        },
        latlng2display: function (pt) {
            return this._map.gcsToDisplay(pt);
        },
        display2latlng: function (pt) {
            return this._map.displayToGcs(pt);
        },
        svg: function () { // interactive svg layer
            return this.svgGroup;
        },
        legend: function () { // non-interactive svg on top
            throw 'Legend layer not yet implemented';
        },
        map: function () { // return the geojs map object
            return this._map;
        },
        _create: function () {
            var node = this.element.get(0),
                opts = {
                    zoom: this.options.zoom,
                    node: node
                },
                that = this;
            this._map = geo.map(opts);
            this._map.addLayer(
                geo.osmLayer({'renderer': 'vglRenderer'}).referenceLayer(true)
            );
            this.svgLayer = geo.featureLayer({'renderer': 'd3Renderer'});
            this._map.addLayer(this.svgLayer);
            this.svgContext = this.svgLayer.renderer().canvas();
            this.svgGroup = this.svgContext.append('g').node();

            this._resize();
            $(window).resize(function () {
                that._resize();
            });
            this._map.on([geo.event.pan, geo.event.zoom], function () {
                $(node).trigger('draw');
            });
        },
        _update: $.noop,
        _resize: function () {
            var w = this.options.width ||
                    this.element.width(),
                h = this.options.height ||
                    this.element.height();
            if (!this._map) { return; }
            this._map.resize(0, 0, w, h);
            this.element.trigger('draw');
        },
        _setOption: function (key, value) {
            this.options[key] = value;
            if (key === 'width' || key === 'height') {
                this._resize();
            }
            this._update();
        }
    });
    /*
     * User listens to events and respondes to them as necessary.
     * To start: 'draw'... force redraw of everything,
     *    later:  more granular, zoom, pan, rotate, etc
     */
}(window.tangelo, window.geo, window.d3, window.jQuery));
