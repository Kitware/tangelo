/*jslint browser: true */

/*global tangelo, d3, google, $ */

(function () {
    "use strict";

    if (!window.google) {
        tangelo.GMap = function () {
            throw "Use of the GMap class requires loading the Google Map API *before* loading Tangelo.";
        };
        return;
    }

    tangelo.GMap = function (elem, mapoptions, cfg) {
        var that;

        // Create the map object and place it into the specified container element.
        this.map = new google.maps.Map(elem, mapoptions);

        // Record the container element.
        this.container = elem;

        // Make the map live.
        this.setMap(this.map);

        // Be sure to call the draw method on drag and resize events.
        that = this;
        google.maps.event.addListener(this.map, "drag", function () { that.draw(); });
        $(elem).resize(function () { google.maps.event.trigger(that.map, "resize"); });

        // Fake an empty configuration if the user did not send one in.
        this.cfg = cfg || {};
    };

    tangelo.GMap.prototype = new google.maps.OverlayView();

    tangelo.GMap.prototype.getSVG = function () {
        return this.svg.node();
    };


    tangelo.GMap.prototype.getSVGGroup = function () {
        return this.group.node();
    };

    tangelo.GMap.prototype.onAdd = function () {
        // Grab the overlay mouse target element (because it can accept, e.g.,
        // mouse hover events to show SVG tooltips), wrap it in a D3 selection,
        // and add the SVG element to it.
        this.overlayLayer = this.getPanes().overlayMouseTarget;

        // Create an SVG element for the overlay, fixed to the top-left of the
        // window (the size will be set later).
        this.svg = d3.select(this.overlayLayer)
            .append("svg")
            .style("position", "fixed")
            .style("top", "0px")
            .style("left", "0px");

        // Insert a top-level group element; the class will manage its translate
        // property, and the user will make use of the element to manage what is
        // rendered.
        this.group = this.svg.append("g");

        // The translation offset for the group element.
        this.groupOffset = {
            x: 0,
            y: 0
        };

        // Call the user's initialization function, passing in the top-level
        // group element.
        if (this.cfg.initialize) {
            this.cfg.initialize.call(this, this.group.node());
        }
    };

    tangelo.GMap.prototype.draw = function () {
        var proj,
            w,
            h,
            containerLatLng,
            divPixels,
            div,
            newLeft,
            newTop,
            svg;

        // Get the transformation from lat/long to pixel coordinates - the
        // lat/long data will be "pushed through" it just prior to being drawn.
        // It is deferred this way to deal with changes in the window size,
        // etc., that can occur without warning.
        proj = this.getProjection();

        // If proj is undefined, the map has not yet been initialized, so return
        // right away.
        if (proj === undefined) {
            return;
        }

        // Compute the pixel offset with respect to the map of the SVG element.
        proj = this.getProjection();
        w = this.container.offsetWidth;
        h = this.container.offsetHeight;
        containerLatLng = proj.fromContainerPixelToLatLng({x: 0, y: 0});
        divPixels = proj.fromLatLngToDivPixel(containerLatLng);

        // TODO(choudhury): this is a big deal - we should NOT have to do
        // completely different things to get the same behavior between Chrome
        // and Firefox.  Figure out what's going on.
        //
        // Perform a translation of the SVG group element in order to move its
        // contents along with the map.
        if ($.browser.mozilla) {
            this.groupOffset.x = -divPixels.x;
            this.groupOffset.y = -divPixels.y;
        } else if ($.browser.chrome) {
            this.groupOffset.x = 0;
            this.groupOffset.y = 0;
        }
        this.group.attr("transform", "translate(" + this.groupOffset.x + ", " + this.groupOffset.y + ")");

        // Resize the SVG element to fit the viewport.
        this.svg.attr("width", w)
            .attr("height", h);

        // Call the user's draw function, passing in the group element and the
        // projection.
        if (this.cfg.draw) {
            this.cfg.draw.call(this, proj, this.group.node());
        }
    };

    // onRemove() destroys the overlay when it is no longer needed.
    tangelo.GMap.prototype.onRemove = function () {
        // TODO(choudhury): implement this function by removing the SVG element
        // from the pane.

        // Call the user's destruct function.
        if (this.cfg.destroy) {
            this.cfg.destroy.call(this);
        }
    };
}());
