/*global tangelo, d3, google */

(function () {
    "use strict";

    tangelo.GMap = function (elem, mapoptions, cfg) {
        var that;

        // Create the map object and place it into the specified container element.
        this.map = new google.maps.Map(elem, mapoptions);

        // Record the container element.
        this.container = elem;

        // Create an empty data array.
        this.locationData = [];

        // Store a null 'overlay' property, which will be filled in with a
        // transparent SVG element when the overlay is sized and placed in the
        // draw() callback.
        this.overlay = null;

        this.dayColor = d3.scale.category10();
        this.monthColor = d3.scale.category20();

        this.setMap(this.map);

        that = this;
        google.maps.event.addListener(this.map, "drag", function () { that.draw(); });

        this.cfg = cfg;
    };

    tangelo.GMap.prototype = new google.maps.OverlayView();

    tangelo.GMap.prototype.onAdd = function () {
        // Grab the overlay mouse target element (because it can accept, e.g.,
        // mouse hover events to show SVG tooltips), wrap it in a D3 selection,
        // and add the SVG element to it.
        this.overlayLayer = this.getPanes().overlayMouseTarget;

        var svg = d3.select(this.overlayLayer).append("div")
            .attr("id", "svgcontainer")
            .style("position", "relative")
            .style("left", "0px")
            .style("top", "0px")
            .append("svg");

        // Add a debugging rectangle.
        //svg.append("rect")
        //.attr("id", "debugrect")
        //.style("fill-opacity", 0.4)
        //.style("fill", "white")
        //.style("stroke", "black")
        //.attr("width", svg.attr("width"))
        //.attr("height", svg.attr("height"));

        svg.append("g")
            .attr("id", "markers");

        // Record the SVG element in the object for later use.
        this.overlay = svg.node();

        // Add an SVG element to the map's div to serve as a color legend.
        svg = d3.select(this.map.getDiv())
            .append("svg")
            .style("position", "fixed")
            .style("top", "100px")
            .style("right", "0px")
            .attr("width", 100)
            .attr("height", 570);

        // Place a transparent rect in the SVG element to serve as its
        // container.
        //
        /*        svg.append("rect")*/
        //.attr("x", 0)
        //.attr("y", 0)
        //.attr("width", "100%")
        //.attr("height", "100%")
        //.style("stroke", "darkslategray")
        //.style("fill-opacity", 0.1);

        // Add an SVG group whose contents will change or disappear based on the
        // active colormap.
        //
        //this.legend = svg.append("g").node();

        if (this.cfg.initialize) {
            this.cfg.initialize.call(this, svg.node());
        }
    };

    // draw() sizes and places the overlaid SVG element.
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

        // Shift the container div to cover the "whole world".
        //
        // First, compute the pixel coordinates of the bounds of the "whole
        // world".
        proj = this.getProjection();
        w = this.container.offsetWidth;
        h = this.container.offsetHeight;
        containerLatLng = proj.fromContainerPixelToLatLng({x: 0, y: 0});
        divPixels = proj.fromLatLngToDivPixel(containerLatLng);

        // Move and resize the div element.
        div = d3.select(this.overlayLayer).select("#svgcontainer");
        newLeft = divPixels.x + "px";
        newTop = divPixels.y + "px";
        div.style("left", newLeft)
            .style("top", newTop)
            .style("width", w + "px")
            .style("height", h + "px");

        // Resize the SVG element to fit the viewport.
        svg = d3.select(this.overlayLayer).select("svg");
        svg.attr("width", w)
            .attr("height", h);

        //// Make the rect element track the SVG element.
        //svg.select("#debugrect")
        //.attr("width", svg.attr("width"))
        //.attr("height", svg.attr("height"));

        if (this.cfg.draw) {
            this.cfg.draw.call(this, proj, svg.node(), divPixels);
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
