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
            height: null,
            tileURL: undefined
        },
        latlng2display: function (pt) {
            return this.svgLayer.renderer().worldToDisplay(pt);
        },
        display2latlng: function (pt) {
            return this.svgLayer.renderer().displayToWorld(pt);
        },
        svg: function () { // interactive svg layer
            return this.svgGroup.node();
        },
        legend: function () { // non-interactive svg on top
            throw 'Legend layer not yet implemented';
        },
        map: function () { // return the geojs map object
            return this._map;
        },
        scale: function () { // return the current map scale
            return this.svgLayer.renderer().scaleFactor();
        },
        _create: function () {
            var node = this.element.get(0),
                opts = {
                    zoom: this.options.zoom,
                    node: node,
                    width: this.options.width,
                    height: this.options.height
                },
                that = this;
            this._map = geo.map(opts);
            this._map.createLayer('osm', { baseUrl: this.options.tileURL });
            this.svgLayer = this._map.createLayer('feature', {'renderer': 'd3Renderer'});
            this.svgGroup = this.svgLayer.renderer().canvas();

            this._resize();
            $(window).resize(function () {
                that._resize();
            });
            this.svgLayer.on(geo.event.d3Rescale, function (arg) {
                $(node).trigger('rescale', arg.scale);
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
        },
        _setOption: function (key, value) {
            if (key === 'tileURL' && this._map) {
                throw "Cannot set tileURL after map creation.";
            }
            this.options[key] = value;
            if (key === 'width' || key === 'height') {
                this._resize();
            }
            this._update();
        }
    });
    /*
     * User listens to events and respondes to them as necessary.
     *     'rescale'... the map zoomed in or out, so rescale features if necessary
     */
}(window.tangelo, window.geo, window.d3, window.jQuery));
