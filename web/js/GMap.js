/*global google */

(function () {
    "use strict";

    tangelo.GMap = function (elem, mapoptions, cfg) {
        var that;

        // Create the map object and place it into the specified container element.
        this.map = new google.maps.Map(elem, options);

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
            this.cfg.initialize.call(this);
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
            svg,
            data,
            days,
            N,
            that,
            color,
            radius,
            opacity,
            markers;

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
            this.cfg.draw.call(this, proj, svg.node());
        }

/*        // Process the data by adjoining pixel locations to each entry.*/
        //data = this.locationData.map(function (d) {
            //d.pixelLocation = proj.fromLatLngToDivPixel(new google.maps.LatLng(d.location[1], d.location[0]));
            //d.pixelLocation.x -= divPixels.x;
            //d.pixelLocation.y -= divPixels.y;
            //return d;
        //});

        //// Filter the results by day (if any of the boxes is checked).
        //days = tangelo.dayNames().filter(function (d) {
            //return document.getElementById(d).checked;
        //});
        //if (days.length > 0) {
            //data = data.filter(function (d) {
                //return days.indexOf(d.day) !== -1;
            //});
        //}

        //// Grab the total number of data items.
        //N = data.length;

        //// Select a colormapping function based on the radio buttons.
        //that = this;
        //color = (function () {
            //var which,
              //colormap,
              //legend,
              //retval,
              //invert,
              //range,
              //scale;

        //// Capture the color legend SVG group element.
        //legend = that.legend;

        //// Determine which radio button is currently selected.
        //which = $("input[name=colormap]:radio:checked").attr("id");

        //// Generate a colormap function to return, and place a color legend
        //// based on it.
        //if (which === 'month') {
            //colormap = function (d) {
                //return that.monthColor(d.month);
            //};

            //$(legend).svgColorLegend({
                //cmap_func: that.monthColor,
                //xoffset: 10,
                //yoffset: 10,
                //categories: tangelo.monthNames(),
                //height_padding: 5,
                //width_padding: 7,
                //text_spacing: 19,
                //legend_margins: {
                    //top: 5,
                //left: 5,
                //bottom: 5,
                //right: 5
                //},
                //clear: true
            //});

            //retval = colormap;
        //} else if (which === 'day') {
            //colormap = function (d) {
                //return that.dayColor(d.day);
            //};

            //$(legend).svgColorLegend({
                //cmap_func: that.dayColor,
                //xoffset: 10,
                //yoffset: 10,
                //categories: tangelo.dayNames(),
                //height_padding: 5,
                //width_padding: 7,
                //text_spacing: 19,
                //legend_margins: {top: 5, left: 5, bottom: 5, right: 5},
                //clear: true
            //});

            //retval = colormap;
        //} else if (which === 'rb') {
            //legend.selectAll("*").remove();

            //invert = document.getElementById("invert").checked;
            //range = invert ? ['blue', 'red'] : ['red', 'blue'];
            //scale = d3.scale.linear()
                //.domain([0, N - 1])
                //.range(range);

            //retval = function (d, i) {
                //return scale(i);
            //};
        //} else {
            //d3.select(legend).selectAll("*").remove();
            //retval = "pink";
        //}

        //return retval;
        //}());

        //// Select a radius function as well.
        //radius = (function () {
            //var which,
               //retval,
               //size;

        //// Determine which radio button is selected.
        //which = $("input[name=size]:radio:checked").attr("id");

        //// Generate a radius function to return.
        //if (which === 'recency') {
            //retval = function (d, i) {
                //return 5 + 15 * (N - 1 - i) / (N - 1);
            //};
        //} else {
            //// Get the size value.
            //size = parseFloat(d3.select("#size").node().value);
            //if (isNaN(size) || size <= 0.0) {
                //size = 5.0;
            //}

            //retval = size;
        //}

        //return retval;
        //}());

        //// Get the opacity value.
        //opacity = flickr.opacityslider.slider("value") / 100;

        //// Compute a data join with the current list of marker locations, using
        //// the MongoDB unique id value as the key function.
        ////
        //[>jslint nomen: true <]
        //markers = d3.select(this.overlay)
            //.select("#markers")
            //.selectAll("circle")
            //.data(data, function (d) {
                //return d._id.$oid;
            //});
        //[>jslint nomen: false <]

        //// For the enter selection, create new circle elements, and attach a
        //// title element to each one.  In the update selection (which includes
        //// the newly added circles), set the proper location and fade in new
        //// elements.  Fade out circles in the exit selection.
        ////
        //// TODO(choudhury): the radius of the marker should depend on the zoom
        //// level - smaller circles at lower zoom levels.
        //markers.enter()
            //.append("circle")
            //.style("opacity", 0.0)
            //.style("cursor", "crosshair")
            //.attr("r", 0)
            //.each(function (d) {
                //var cfg,
                //msg,
                //date;

            //date = new Date(d.date.$date);

            //msg = "";
            //msg += "<b>Date:</b> " + tangelo.date.getDayName(date) + " " + tangelo.date.toShortString(date) + "<br>\n";
            //msg += "<b>Location:</b> (" + d.location[1] + ", " + d.location[0] + ")<br>\n";
            //msg += "<b>Author:</b> " + d.author + "<br>\n";
            //msg += "<b>Description:</b> " + d.title + "<br>\n";

            //cfg = {
                //html: true,
            //container: "body",
            //placement: "top",
            //trigger: "hover",
            //content: msg,
            //delay: {
                //show: 0,
                //hide: 0
            //}
            //};
            //$(this).popover(cfg);
            //});

        //// This is to prevent division by zero if there is only one data
        //// element.
        //if (N === 1) {
            //N = 2;
        //}
        //markers
            //.attr("cx", function (d) {
                //return d.pixelLocation.x;
            //})
        //.attr("cy", function (d) {
            //return d.pixelLocation.y;
        //})
        //.style("fill", color)
            ////.style("fill-opacity", 0.6)
            //.style("fill-opacity", 1.0)
            //.style("stroke", "black")
            //.transition()
            //.duration(500)
            ////.attr("r", function(d, i) { return 5 + 15*(N-1-i)/(N-1); })
            //.attr("r", radius)
            ////.style("opacity", 1.0);
            //.style("opacity", opacity);
        ////.style("opacity", function(d, i){ return 0.3 + 0.7*i/(N-1); });

        //markers.exit()
            //.transition()
            //.duration(500)
            //.style("opacity", 0.0)
            /*.remove();*/
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

/*    tangelo.GMap.prototype.locations = function (locationData) {*/
        //// TODO(choudhury): it might be better to actually copy the values here.
        ////
        //this.locationData = locationData;
        ////this.locationData.length = 0;
        ////for(var i=0; i<locationData.length; i++){
        ////this.locationData.push(locationData[i]);
        ////}
    /*};*/
}());
