/*jslint browser:true, todo:true, unparam:true */

/*globals tangelo, flickr, $, google, d3, date, console */

var flickr = {};
flickr.map = null;
flickr.timeslider = null;

flickr.cfgDefaults = null;

flickr.getMongoDBInfo = function () {
    "use strict";

    // Read in the config options regarding which MongoDB
    // server/database/collection to use.
    return {
        server: localStorage.getItem('flickr:mongodb-server') || flickr.cfgDefaults["mongodb-server"] || 'localhost',
        db: localStorage.getItem('flickr:mongodb-db') || flickr.cfgDefaults["mongodb-db"] || 'xdata',
        coll: localStorage.getItem('flickr:mongodb-coll') || flickr.cfgDefaults["mongodb-coll"] || 'flickr_paris'
    };
};

function showConfig() {
    "use strict";

    var cfg;

    cfg = flickr.getMongoDBInfo();
    d3.select("#mongodb-server").property("value", cfg.server);
    d3.select("#mongodb-db").property("value", cfg.db);
    d3.select("#mongodb-coll").property("value", cfg.coll);
}

function updateConfig() {
    "use strict";

    var server,
        db,
        coll;

    // Grab the elements.
    server = document.getElementById("mongodb-server");
    db = document.getElementById("mongodb-db");
    coll = document.getElementById("mongodb-coll");

    // Write the options into DOM storage.
    localStorage.setItem('flickr:mongodb-server', server.value);
    localStorage.setItem('flickr:mongodb-db', db.value);
    localStorage.setItem('flickr:mongodb-coll', coll.value);
}

function setConfigDefaults() {
    "use strict";

    var cfg;

    // Clear out the locally stored options.
    localStorage.removeItem('flickr:mongodb-server');
    localStorage.removeItem('flickr:mongodb-db');
    localStorage.removeItem('flickr:mongodb-coll');

    // Retrieve the new config values, and set them into the fields.
    cfg = flickr.getMongoDBInfo();
    d3.select("#mongodb-server").property("value", cfg.server);
    d3.select("#mongodb-db").property("value", cfg.db);
    d3.select("#mongodb-coll").property("value", cfg.coll);
}

function retrieveData() {
    "use strict";

    var times,
        timequery,
        hashtagText,
        hashtags,
        hashtagquery,
        query,
        mongo;

    // Interrogate the UI elements to build up a query object for the database.
    //
    // Get the time slider range.
    times = flickr.timeslider.slider("values");

    // Construct a query that selects times between the two ends of the slider.
    timequery = {
        $and : [{'date' : {$gte : {"$date" : times[0]}}},
                {'date' : {$lte : {"$date" : times[1]}}}]
    };

    // Get the hashtag text and split it into several tags.
    hashtagText = d3.select("#hashtags").node().value;
    hashtags = [];
    if (hashtagText !== "") {
        hashtags = hashtagText.split(/\s+/);
    }

    // Construct a query to find any entry containing any of these tags.
    hashtagquery = {};
    if (hashtags.length > 0) {
        hashtagquery = { 'hashtags' : {$in : hashtags}};
    }

    // Stitch all the queries together into a "superquery".
    query = {$and : [timequery, hashtagquery]};

    // Enable the abort button and issue the query to the mongo module.
    mongo = flickr.getMongoDBInfo();
    d3.select("#abort")
        .classed("btn-success", false)
        .classed("btn-danger", true)
        .classed("disabled", false)
        .html("Abort query <i class=\"icon-repeat icon-white spinning\"></i>");

    flickr.currentAjax = $.ajax({
        type: 'POST',
        url: '/service/mongo/' + mongo.server + '/' + mongo.db + '/' + mongo.coll,
        data: {
            query: JSON.stringify(query),
            limit: d3.select("#record-limit").node().value,
            sort: JSON.stringify([['date', 1]])
        },
        dataType: 'json',
        success: function (response) {
            var N,
                data;

            // Remove the stored XHR object.
            flickr.currentAjax = null;

            // Error check.
            if (response.error !== null) {
                console.log("fatal error: " + response.error);
                d3.select("#abort")
                    .classed("btn-success", false)
                    .classed("btn-danger", true)
                    .classed("disabled", true)
                    .html("error: " + response.error);
                return;
            }

            // Indicate success, display the number of records, and disable the
            // button.
            N = response.result.data.length;
            d3.select("#abort")
                .classed("btn-danger", false)
                .classed("btn-success", true)
                .classed("disabled", true)
                .text("Got " + N + " result" + (N === 0 || N > 1 ? "s" : ""));

            // Process the data to add some interesting features
            //
            // Extract some information from the date.
            data = response.result.data.map(function (d) {
                var date = new Date(d.date.$date);

                d.month = tangelo.date.getMonthName(date);
                d.day = tangelo.date.getDayName(date);
                return d;
            });

            // Store the retrieved values in the map object.
            flickr.map.locations(data);

            // Redraw the map.
            flickr.map.draw();
        }
    });
}

function getMinMaxDates(zoom) {
    "use strict";

    var mongo;

    mongo = flickr.getMongoDBInfo();

    // Get the earliest and latest times in the collection, and set the slider
    // range/handles appropriately.
    tangelo.getMongoRange(mongo.server, mongo.db, mongo.coll, "date", function (min, max) {
        // Retrieve the timestamps from the records.
        min = min.$date;
        max = max.$date;

        // Set the min and max of the time slider.
        flickr.timeslider.slider("option", "min", min);
        flickr.timeslider.slider("option", "max", max);

        // Set the low slider handle to July 30 (for a good initial setting to
        // investigate the data), and the high handle to the max.
        flickr.timeslider.slider("values", 0, Date.parse("Jul 30, 2012 01:31:06"));
        flickr.timeslider.slider("values", 1, max);

        // Zoom the slider to this range, if requested.
        if (zoom) {
            zoom(flickr.timeslider);
        }

        // Finally, retrieve the initial data to bootstrap the
        // application.
        retrieveData();

        // Add the 'retrieveData' behavior to the slider's onchange
        // callback (which starts out ONLY doing the 'displayFunc'
        // part).
        flickr.timeslider.slider("option", "change", function (evt, ui) {
            var low,
                high;

            low = ui.values[0];
            high = ui.values[1];

            flickr.displayFunc(low, high);
            retrieveData();
        });
    });
}

function retrieveDataSynthetic() {
    "use strict";

    var chicago,
        paris,
        slc,
        albany,
        dhaka,
        rio,
        wellington,
        locs;

    // Generate a few lat/long values in well-known places.
    chicago = [42.0, -87.5];
    paris = [48.9, 2.3];
    slc = [40.8, -111.9];
    albany = [42.7, -73.8];
    dhaka = [23.7, 90.4];
    rio = [-22.9, -43.2];
    wellington = [-41.3, 174.8];

    // Take the array of arrays, and map it to an array of google LatLng
    // objects.
    locs = [chicago, paris, slc, albany, dhaka, rio, wellington].map(function (d) { return new google.maps.LatLng(d[0], d[1]); });

    // Store the retrieved values.
    flickr.map.locations(locs);

    // After data is reloaded to the map-overlay object, redraw the map.
    flickr.map.draw();
}

function GMap(elem, options) {
    "use strict";

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
}

window.onload = function () {
    "use strict";

    tangelo.requireCompatibleVersion("0.2");

    tangelo.defaults("defaults.json", function (defaults) {
        var options,
            div,
            buttons,
            i,
            checkbox,
            dayboxes,
            popover_cfg,
            zoomfunc,
            redraw;

        flickr.cfgDefaults = defaults;

        flickr.timeslider = $("#time-slider");

        // Enable the popover help items.
        //
        // First create a config object with the common options preset.
        popover_cfg = {
            html: true,
            container: "body",
            placement: "top",
            trigger: "hover",
            title: null,
            content: null,
            delay: {
                show: 100,
                hide: 100
            }
        };

        // Time slider help.
        popover_cfg.title = "Time Filtering";
        popover_cfg.content = "Display photos taken between two particular dates/times.<br><br>" +
            "The 'zoom to range' button will make the slider represent the currently selected time slice, " +
            "while the 'unzoom' button undoes one zoom.";
        $("#time-filter-help").popover(popover_cfg);

        // Hashtag help.
        popover_cfg.title = "Hashtag Filtering";
        popover_cfg.content = "Display photos including the list of hashtags specified.  Be sure to include the initial '#'!";
        $("#hashtag-filter-help").popover(popover_cfg);

        // TODO(choudhury): Probably the GMap prototype extension stuff should all
        // go in its own .js file.
        //
        // Equip ourselves with the overlay prototype.
        GMap.prototype = new google.maps.OverlayView();

        // Implement the callbacks for controlling the overlay.
        //
        // onAdd() signals that the map's panes are ready to receive the overlaid
        // DOM element.
        GMap.prototype.onAdd = function () {
            console.log("onAdd()!");

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
            this.legend = svg.append("g").node();
        };

        // draw() sizes and places the overlaid SVG element.
        GMap.prototype.draw = function () {
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

            // Process the data by adjoining pixel locations to each entry.
            data = this.locationData.map(function (d) {
                d.pixelLocation = proj.fromLatLngToDivPixel(new google.maps.LatLng(d.location[1], d.location[0]));
                d.pixelLocation.x -= divPixels.x;
                d.pixelLocation.y -= divPixels.y;
                return d;
            });

            // Filter the results by day (if any of the boxes is checked).
            days = tangelo.dayNames().filter(function (d) {
                return document.getElementById(d).checked;
            });
            if (days.length > 0) {
                data = data.filter(function (d) {
                    return days.indexOf(d.day) !== -1;
                });
            }

            // Grab the total number of data items.
            N = data.length;

            // Select a colormapping function based on the radio buttons.
            that = this;
            color = (function () {
                var which,
                    colormap,
                    legend,
                    retval,
                    invert,
                    range,
                    scale;

                // Capture the color legend SVG group element.
                legend = that.legend;

                // Determine which radio button is currently selected.
                which = $("input[name=colormap]:radio:checked").attr("id");

                // Generate a colormap function to return, and place a color legend
                // based on it.
                if (which === 'month') {
                    colormap = function (d) {
                        return that.monthColor(d.month);
                    };

                    $(legend).svgColorLegend({
                        cmap_func: that.monthColor,
                        xoffset: 10,
                        yoffset: 10,
                        categories: tangelo.monthNames(),
                        height_padding: 5,
                        width_padding: 7,
                        text_spacing: 19,
                        legend_margins: {
                            top: 5,
                            left: 5,
                            bottom: 5,
                            right: 5
                        },
                        clear: true
                    });

                    retval = colormap;
                } else if (which === 'day') {
                    colormap = function (d) {
                        return that.dayColor(d.day);
                    };

                    $(legend).svgColorLegend({
                        cmap_func: that.dayColor,
                        xoffset: 10,
                        yoffset: 10,
                        categories: tangelo.dayNames(),
                        height_padding: 5,
                        width_padding: 7,
                        text_spacing: 19,
                        legend_margins: {top: 5, left: 5, bottom: 5, right: 5},
                        clear: true
                    });

                    retval = colormap;
                } else if (which === 'rb') {
                    legend.selectAll("*").remove();

                    invert = document.getElementById("invert").checked;
                    range = invert ? ['blue', 'red'] : ['red', 'blue'];
                    scale = d3.scale.linear()
                        .domain([0, N - 1])
                        .range(range);

                    retval = function (d, i) {
                        return scale(i);
                    };
                } else {
                    d3.select(legend).selectAll("*").remove();
                    retval = "pink";
                }

                return retval;
            }());

            // Select a radius function as well.
            radius = (function () {
                var which,
                    retval,
                    size;

                // Determine which radio button is selected.
                which = $("input[name=size]:radio:checked").attr("id");

                // Generate a radius function to return.
                if (which === 'recency') {
                    retval = function (d, i) {
                        return 5 + 15 * (N - 1 - i) / (N - 1);
                    };
                } else {
                    // Get the size value.
                    size = parseFloat(d3.select("#size").node().value);
                    if (isNaN(size) || size <= 0.0) {
                        size = 5.0;
                    }

                    retval = size;
                }

                return retval;
            }());

            // Get the opacity value.
            opacity = flickr.opacityslider.slider("value") / 100;

            // Compute a data join with the current list of marker locations, using
            // the MongoDB unique id value as the key function.
            //
            /*jslint nomen: true */
            markers = d3.select(this.overlay)
                .select("#markers")
                .selectAll("circle")
                .data(data, function (d) {
                    return d._id.$oid;
                });
            /*jslint nomen: false */

            // For the enter selection, create new circle elements, and attach a
            // title element to each one.  In the update selection (which includes
            // the newly added circles), set the proper location and fade in new
            // elements.  Fade out circles in the exit selection.
            //
            // TODO(choudhury): the radius of the marker should depend on the zoom
            // level - smaller circles at lower zoom levels.
            markers.enter()
                .append("circle")
                .style("opacity", 0.0)
                .style("cursor", "crosshair")
                .attr("r", 0)
                .each(function (d) {
                    var cfg,
                        msg,
                        date;

                    date = new Date(d.date.$date);

                    msg = "";
                    msg += "<b>Date:</b> " + tangelo.date.getDayName(date) + " " + tangelo.date.toShortString(date) + "<br>\n";
                    msg += "<b>Location:</b> (" + d.location[1] + ", " + d.location[0] + ")<br>\n";
                    msg += "<b>Author:</b> " + d.author + "<br>\n";
                    msg += "<b>Description:</b> " + d.title + "<br>\n";

                    cfg = {
                        html: true,
                        container: "body",
                        placement: "top",
                        trigger: "hover",
                        content: msg,
                        delay: {
                            show: 0,
                            hide: 0
                        }
                    };
                    $(this).popover(cfg);
                });

            // This is to prevent division by zero if there is only one data
            // element.
            if (N === 1) {
                N = 2;
            }
            markers
                .attr("cx", function (d) {
                    return d.pixelLocation.x;
                })
                .attr("cy", function (d) {
                    return d.pixelLocation.y;
                })
                .style("fill", color)
                //.style("fill-opacity", 0.6)
                .style("fill-opacity", 1.0)
                .style("stroke", "black")
                .transition()
                .duration(500)
                //.attr("r", function(d, i) { return 5 + 15*(N-1-i)/(N-1); })
                .attr("r", radius)
                //.style("opacity", 1.0);
                .style("opacity", opacity);
                //.style("opacity", function(d, i){ return 0.3 + 0.7*i/(N-1); });

            markers.exit()
                .transition()
                .duration(500)
                .style("opacity", 0.0)
                .remove();
        };

        // onRemove() destroys the overlay when it is no longer needed.
        GMap.prototype.onRemove = function () {
            // TODO(choudhury): implement this function by removing the SVG element
            // from the pane.
            console.log("onRemove()!");

        };

        GMap.prototype.locations = function (locationData) {
            // TODO(choudhury): it might be better to actually copy the values here.
            //
            this.locationData = locationData;
            //this.locationData.length = 0;
            //for(var i=0; i<locationData.length; i++){
                //this.locationData.push(locationData[i]);
            //}
        };

        // This function is used to display the current state of the time slider.
        flickr.displayFunc = (function () {
            var lowdiv,
                highdiv;

            lowdiv = d3.select("#low");
            highdiv = d3.select("#high");

            return function (low, high) {
                lowdiv.html(tangelo.date.toShortString(new Date(low)));
                highdiv.html(tangelo.date.toShortString(new Date(high)));
            };
        }());

        // Create a range slider for slicing by time.  Whenever the slider changes
        // or moves, update the display showing the current time range.  Eventually,
        // the "onchange" callback (which fires when the user releases the mouse
        // button when making a change to the slider position) will also trigger a
        // database lookup, but at the moment we omit that functionality to avoid
        // spurious database lookups as the engine puts the slider together and sets
        // the positions of the sliders programmatically.
        flickr.timeslider.slider({
            range: true,

            change: function (evt, ui) {
                var low,
                    high;

                low = ui.values[0];
                high = ui.values[1];

                flickr.displayFunc(low, high);
            },

            slide: function (evt, ui) {
                var low,
                    high;

                low = ui.values[0];
                high = ui.values[1];

                flickr.displayFunc(low, high);
            }
        });

        // Some options for initializing the google map.
        //
        // Set to Paris, with good view of the Seine.
        options = {
            zoom: 13,
            center: new google.maps.LatLng(48.86, 2.33),
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        div = d3.select("#map").node();
        flickr.map = new GMap(div, options);

        // Direct the colormap selector radio buttons to redraw the map when they
        // are clicked.
        buttons = document.getElementsByName("colormap");
        redraw = function () {
            flickr.map.draw();
        };
        for (i = 0; i < buttons.length; i += 1) {
            buttons[i].onclick = redraw;
        }
        checkbox = document.getElementById("invert");
        checkbox.onclick = function () {
            flickr.map.draw();
        };

        // Direct the day filter checkboxes to redraw the map when clicked.
        dayboxes = tangelo.dayNames().map(function (d) {
            return document.getElementById(d);
        });

        for (i = 0; i < dayboxes.length; i += 1) {
            dayboxes[i].onclick = redraw;
        }

        // Direct the glyph size radio buttons to redraw.
        buttons = document.getElementsByName("size");
        for (i = 0; i < buttons.length; i += 1) {
            buttons[i].onclick = redraw;
        }

        // Direct the size control to redraw.
        document.getElementById("size").onchange = redraw;

        // Create a regular slider for setting the opacity and direct it to redraw
        // when it changes (but not on every slide action - that would be bulky and
        // too slow; the UI doesn't demand that level of responsivity).
        flickr.opacityslider = $("#opacity");
        flickr.opacityslider.slider({
            min: 0,
            max: 100,
            value: 100,
            change: redraw
        });

        // The database lookup should happen again when the hashtag list or record
        // count limit field changes.
        d3.select("#hashtags").node().onchange = retrieveData;
        d3.select("#record-limit").node().onchange = retrieveData;

        // Attach actions to the zoom and unzoom buttons.
        zoomfunc = (function () {
            var unzoom,
                stack;

            unzoom = d3.select("#unzoom");

            stack = [];

            return {
                zoomer: function (slider) {
                    var value,
                        bounds;

                    // Return immediately if the handles are already at the bounds.
                    //value = slider.getValue();
                    value = slider.slider("values");
                    //bounds = [slider.getMin(), slider.getMax()];
                    bounds = [slider.slider("option", "min"), slider.slider("option", "max")];
                    if (value[0] === bounds[0] && value[1] === bounds[1]) {
                        return;
                    }

                    // Save the current bounds on the stack.
                    stack.push(bounds);

                    // Set the bounds of the slider to be its current value range.
                    //slider.setMin(value[0]);
                    slider.slider("option", "min", value[0]);
                    slider.slider("option", "max", value[1]);

                    // Activate the unzoom button if this is the first entry in the
                    // stack.
                    if (stack.length === 1) {
                        unzoom.classed("disabled", false);
                    }
                },

                unzoomer: function (slider) {
                    var bounds;

                    // Make sure this function is not being called when there are no
                    // entries in the stack.
                    if (stack.length === 0) {
                        throw "Logic error: Unzoom button was clicked even though there is nothing to unzoom to.";
                    }

                    // Pop a bounds value from the stack, and set it as the bounds
                    // for the slider.
                    bounds = stack.pop();
                    //slider.setMin(bounds[0]);
                    slider.slider("option", "min", bounds[0]);
                    //slider.setMax(bounds[1]);
                    slider.slider("option", "max", bounds[1]);

                    // If the stack now contains no entries, disable the unzoom
                    // button.
                    if (stack.length === 0) {
                        unzoom.classed("disabled", true);
                    }
                }
            };
        }());

        d3.select("#zoom")
            .data([flickr.timeslider])
            .on('click', zoomfunc.zoomer);

        d3.select("#unzoom")
            .data([flickr.timeslider])
            .on('click', zoomfunc.unzoomer);

        // Get the earliest and latest times in the database, to create a suitable
        // range for the time slider.  Pass in the "zoomer" function so the initial
        // range can be properly zoomed to begin with.
        getMinMaxDates(zoomfunc.zoomer);

        // Install the abort action on the button.
        d3.select("#abort")
            .on("click", function () {
                // If there is a current ajax call in flight, abort it (it is
                // theoretically possible that the abort button is clicked between
                // the time it's activated, and the time an ajax call is sent).
                if (flickr.currentAjax) {
                    flickr.currentAjax.abort();
                    flickr.currentAjax = null;

                    // Place a message in the abort button.
                    d3.select("#abort")
                        .classed("disabled", true)
                        .text("Query aborted");
                }

                // Disable the button.
                d3.select("#abort").classed("disabled", true);
            });
    });
};
