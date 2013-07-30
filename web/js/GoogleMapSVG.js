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
        google.maps.event.addListener(this.map, "drag", function () {
            that.draw();
        });
        google.maps.event.addListener(this.map, "zoom_changed", function () {
            that.draw();
        });
        $(this.mapdiv).resize(function () {
            google.maps.event.trigger(this.map, "resize");
        });

        // Store the config for later use.
        this.cfg = cfg || {};

        // If a continuation function was passed, call it with the new object as
        // soon as the map is actually ready.
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

    // This function is part of the overlay interface - it will be called when a
    // new map element is added to the overlay (as in the constructor function
    // above).
    tangelo.GoogleMapSVG.prototype.onAdd = function () {
        // Put an SVG element in the mouse target overlay.
        this.svg = d3.select(this.getPanes().overlayMouseTarget)
            .append("svg")
            .attr("width", this.size.width)
            .attr("height", this.size.height);

        // If the user supplied an initialization function, call it now.
        if (this.cfg.initialize) {
            this.cfg.initialize.call(this, this.svg.node(), this.getProjection(), this.map.getZoom());
        }

    };

    // This is called when the Google Map API decides to redraw the map, or when
    // the GoogleMapSVG interface needs the map redrawn.
    tangelo.GoogleMapSVG.prototype.draw = function () {
        var mattrans,
            xtrans,
            ytrans,
            setTimeout;

        // Find the matrix transform for the overlay.
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

        // If the map is in the middle of a zooming transform, abort the draw
        // operation and try again in a little while.
        if (mattrans[0] !== "1" || mattrans[3] !== "1") {
            window.setTimeout(google.maps.event.trigger, 100, this.map, "drag");
            return;
        }

        // Extract the translation component.
        xtrans = mattrans[4];
        ytrans = mattrans[5];

        // Give the svg element an opposite transform to hold it in place.
        this.svg.style("-webkit-transform", "translate(" + (-xtrans) + "px," + (-ytrans) + "px)");

        // Call the user's draw method, if there is one.
        if (this.cfg.draw) {
            this.cfg.draw.call(this, this.svg.node(), this.getProjection(), this.map.getZoom());
        }
    };
}());
