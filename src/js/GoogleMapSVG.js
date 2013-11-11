/*jslint browser: true */

/*global tangelo, google, d3, $ */

(function () {
    "use strict";

    if (!window.google) {
        tangelo.GoogleMapSVG = function () {
            throw "Use of the GoogleMapSVG class requires loading the Google Map API *before* loading Tangelo.";
        };
        return;
    }

    tangelo.GoogleMapSVG = function (elem, mapoptions, cfg, cont) {
        var that,
            idle,
            sel;

        // Obtain a unique id for this class.
        this.id = "gmsvg-" + tangelo.uniqueID();

        // Create a div element to put in the container element.
        this.mapdiv = d3.select(elem)
            .append("div")
            .attr("id", this.id)
            .style("width", $(elem).width() + "px")
            .style("height", $(elem).height() + "px")
            .node();

        // Create the map and place it in the "map div".
        this.map = new google.maps.Map(this.mapdiv, mapoptions);
        this.setMap(this.map);

        // Compute the size of the map div.
        this.size = {
            width: $(this.mapdiv).width(),
            height: $(this.mapdiv).height()
        };

        // When the map is dragged, resized, or zoomed, emit the appropriate
        // events and/or redraw the SVG layer.
        that = this;
        $(this.mapdiv).resize(function () {
            google.maps.event.trigger(this.map, "resize");
        });

        // Store the config for later use.
        this.cfg = cfg || {};

        // If a continuation function was passed, call it with the new object as
        // soon as the map is actually ready.
        //
        // TODO(choudhury): eliminate the cont argument and instead attach a
        // one-time idle listener to the newly created map (in the client code).
        if (cont) {
            google.maps.event.addListenerOnce(this.map, "idle", function () {
                cont(that);
            });
        }
    };

    // Enable the class to use Google Map overlays.
    tangelo.GoogleMapSVG.prototype = new google.maps.OverlayView();

    // Function to return the SVG DOM node, for generic manipulation.
    tangelo.GoogleMapSVG.prototype.getSVG = function () {
        return this.svg.node();
    };

    tangelo.GoogleMapSVG.prototype.getMap = function () {
        return this.map;
    };

    tangelo.GoogleMapSVG.prototype.computeCBArgs = function () {
        var mattrans;

        // Grab the matrix transform from the map div.
        mattrans = d3.select("#" + this.id + " [style*='webkit-transform: matrix']")
            .style("-webkit-transform")
            .split(" ")
            .map(function (v, i) {
                var retval;

                if (i === 0) {
                    retval = v.slice("matrix(".length, -1);
                } else {
                    retval = v.slice(0, -1);
                }

                return retval;
            });

        // Construct the parameters object and return it.
        return {
            // The top-level SVG node.
            svg: this.svg.node(),

            // The Google Map projection object.
            projection: this.getProjection(),

            // The map zoom level.
            zoom: this.map.getZoom(),

            // The map translation vector (extracted for convenience from the
            // transform matrix).
            translation: {
                x: mattrans[4],
                y: mattrans[5]
            },

            // The transform matrix itself.
            transform: mattrans,

            // A boolean indicating whether the map is in the middle of a
            // zooming action.
            zooming: mattrans[0] !== "1" || mattrans[3] !== "1"
        };
    };

    // Attach event listeners to the map.
    tangelo.GoogleMapSVG.prototype.attachListener = function (eventType, callback, how) {
        var that = this;
        var attacher;

        if (Object.prototype.toString.call(eventType) === "[object Array]") {
            $.each(eventType, function (i, v) {
                that.attachListener(v, callback, how);
            });
            return;
        }

        if (how === "once") {
            attacher = google.maps.event.addListenerOnce;
        } else if (how === "always") {
            attacher = google.maps.event.addListener;
        } else {
            throw "illegal value for 'once'";
        }

        attacher(this.map, eventType, function () {
            var args = that.computeCBArgs();

            // Some special behavior for the draw callback.
            if (eventType === "draw") {
                // If the map is in the middle of a zoom operation, delay the
                // draw call until a bit later (to give the zoom a chance to
                // finish).
                if (args.zooming) {
                    // TOOD(choudhury): figure out why a "drag" event is
                    // triggered for the delay case.
                    //window.setTimeout(google.maps.event.trigger, 100, that.map, "drag");
                    window.setTimeout(google.maps.event.trigger, 100, that.map, "draw");
                }
            }

            // Call the user's specified function with the collected data.
            callback.call(that, args);
        });
    };

    tangelo.GoogleMapSVG.prototype.on = function (eventType, callback) {
        this.attachListener(eventType, callback, "always");
    };

    tangelo.GoogleMapSVG.prototype.onceOn = function (eventType, callback) {
        this.attachListener(eventType, callback, "once");
    };

    tangelo.GoogleMapSVG.prototype.trigger = function (eventType) {
        google.maps.event.trigger(this.map, eventType);
    };

    tangelo.GoogleMapSVG.prototype.shift = function (what, x, y) {
        d3.select(what)
            .style("-webkit-transform", "translate(" + x + "px, " + y + "px)");
    };

    // This function is part of the overlay interface - it will be called when a
    // new map element is added to the overlay (as in the constructor function
    // above).
    tangelo.GoogleMapSVG.prototype.onAdd = function () {
        // Put an SVG element in the mouse target overlay.
        this.svg = d3.select(this.getPanes().overlayMouseTarget)
            .append("svg")
            .attr("width", this.size.width)
            .attr("height", this.size.height)
            .append("g")
            .attr("id", "transformlayer");

        // If the user supplied an initialization function, call it now.
        if (this.cfg.initialize) {
            this.cfg.initialize.call(this, this.svg.node(), this.getProjection(), this.map.getZoom());
        }
    };

    // This function has to be defined, but we wish to defer the actual draw
    // action to the user, vis the on() and onceOn() methods.
    tangelo.GoogleMapSVG.prototype.draw = function () {}
}());
