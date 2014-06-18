/*jslint browser:true, unparam:true */

/*globals tangelo, flickr, $, google, d3, date, console */

var flickr = {};
flickr.map = null;
flickr.timeslider = null;

flickr.config = null;

flickr.locationData = null;

flickr.dayColor = d3.scale.category10();
flickr.monthColor = d3.scale.category20();

flickr.dayName = d3.time.format("%a");
flickr.monthName = d3.time.format("%b");
flickr.dateformat = d3.time.format("%a %b %e, %Y (%H:%M:%S)");

flickr.monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
];

flickr.dayNames = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat"
];

flickr.getMongoRange = function (host, db, coll, field, callback) {
    "use strict";

    var min,
        max,
        mongourl;

    // The base URL for both of the mongo service queries.
    mongourl = "/service/mongo/" + host + "/" + db + "/" + coll;

    // Fire an ajax call to retrieve the maxmimum value.
    $.ajax({
        url: mongourl,
        data: {
            sort: JSON.stringify([[field, -1]]),
            limit: 1,
            fields: JSON.stringify([field])
        },
        dataType: "json",
        success: function (response) {
            // If the value could not be retrieved, set it to null and print
            // an error message on the console.
            if (response.error || response.result.data.length === 0) {
                max = null;
            } else {
                max = response.result.data[0][field];
            }

            // Fire a second query to retrieve the minimum value.
            $.ajax({
                url: mongourl,
                data: {
                    sort: JSON.stringify([[field, 1]]),
                    limit: 1,
                    fields: JSON.stringify([field])
                },
                dataType: "json",
                success: function (response) {
                    // As before, set the min value to null if it could not
                    // be retrieved.
                    if (response.error || response.result.data.length === 0) {
                        min = null;
                    } else {
                        min = response.result.data[0][field];
                    }

                    // Pass the range to the user callback.
                    callback(min, max);
                }
            });
        }
    });
};

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

function retrieveData(initial) {
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
        $and : [{"datetaken" : {$gte : {"$date" : times[0]}}},
                {"datetaken" : {$lte : {"$date" : times[1]}}}]
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
    d3.select("#abort")
        .classed("btn-success", false)
        .classed("btn-danger", true)
        .classed("disabled", false)
        .html("Abort query <img src=wait.gif>");

    flickr.currentAjax = $.ajax({
        type: 'POST',
        url: '/service/mongo/' + flickr.config.server + '/' + flickr.config.db + '/' + flickr.config.coll,
        data: {
            query: JSON.stringify(query),
            limit: d3.select("#record-limit").node().value,
            sort: JSON.stringify([["datetaken", 1]])
        },
        dataType: 'json',
        success: function (response) {
            var N,
                data,
                gmap_cfg,
                options,
                div;

            // Remove the stored XHR object.
            flickr.currentAjax = null;

            // Error check.
            if (response.error) {
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
                var date = new Date(d.datetaken.$date);

                d.month = flickr.monthName(date);
                d.day = flickr.dayName(date);
                return d;
            });

            // Store the retrieved values.
            flickr.locationData = data;

            if (initial) {
                // Create the map object.
                gmap_cfg = {
                    initialize: function (svg) {
                        // Add an SVG group whose contents will change or
                        // disappear based on the active colormap.
                        this.legend = d3.select(svg).append("g").node();
                        this.trigger("draw");
                    },

                    draw: function (d) {
                        var data,
                            days,
                            N,
                            that,
                            color,
                            radius,
                            opacity,
                            markers,
                            svg = d.svg,
                            proj = d.projection,
                            trans = d.translation;

                        this.shift(svg, -trans.x, -trans.y);

                        // Process the data by adjoining pixel locations to each
                        // entry.
                        data = flickr.locationData.map(function (d) {
                            d.pixelLocation = proj.fromLatLngToContainerPixel(new google.maps.LatLng(d.location[1], d.location[0]));
                            return d;
                        });

                        // Filter the results by day (if any of the boxes is checked).
                        days = flickr.dayNames.filter(function (d) {
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

                            // Determine which radio button is currently
                            // selected.
                            which = $("input[name=colormap]:radio:checked").attr("id");

                            // Generate a colormap function to return, and place a color legend
                            // based on it.
                            if (which === 'month') {
                                colormap = function (d) {
                                    return flickr.monthColor(d.month);
                                };

                                $(that.legend).svgColorLegend({
                                    cmap_func: flickr.monthColor,
                                    xoffset: $(window).width() - 100,
                                    yoffset: 50,
                                    categories: flickr.monthNames,
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
                                    return flickr.dayColor(d.day);
                                };

                                $(that.legend).svgColorLegend({
                                    cmap_func: flickr.dayColor,
                                    xoffset: $(window).width() - 100,
                                    yoffset: 50,
                                    categories: flickr.dayNames,
                                    height_padding: 5,
                                    width_padding: 7,
                                    text_spacing: 19,
                                    legend_margins: {top: 5, left: 5, bottom: 5, right: 5},
                                    clear: true
                                });

                                retval = colormap;
                            } else if (which === 'rb') {
                                d3.select(that.legend).selectAll("*").remove();

                                invert = document.getElementById("invert").checked;
                                range = invert ? ['blue', 'red'] : ['red', 'blue'];
                                scale = d3.scale.linear()
                                    .domain([0, N - 1])
                                    .range(range);

                                retval = function (d, i) {
                                    return scale(i);
                                };
                            } else {
                                d3.select(that.legend).selectAll("*").remove();
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
                        markers = d3.select(svg)
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

                                date = new Date(d.datetaken.$date);

                                msg = "";
                                msg += "<b>Date:</b> " + flickr.dateformat(date) + "<br>\n";
                                msg += "<b>Location:</b> (" + d.location[1] + ", " + d.location[0] + ")<br>\n";
                                msg += "<b>Owner:</b> " + d.owner + "<br>\n";
                                msg += "<b>Description:</b> " + d.title + "<br>\n";
                                if (d.url) {
                                    msg += "<img src=" + d.url + ">";
                                }

                                cfg = {
                                    html: true,
                                    container: "body",
                                    placement: "right",
                                    trigger: "hover",
                                    content: msg,
                                    delay: {
                                        show: 0,
                                        hide: 0
                                    }
                                };
                                $(this).popover(cfg)
                                    .on("shown.bs.popover", function () {
                                        window.setTimeout(function () {
                                            var top = +$(".popover").css("top").split("px")[0],
                                                imgHeight = +$(".popover img").height();

                                            $(".popover").css("top", (top - imgHeight/2 + 10) + "px");
                                        }, 200);
                                    });
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
                    }
                };

                // Some options for initializing the google map.
                //
                // Set to Paris, with good view of the Seine.
                options = {
                    zoom: 13,
                    center: new google.maps.LatLng(48.86, 2.33),
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
                div = d3.select("#map").node();
                flickr.map = new tangelo.GoogleMapSVG(div, options, gmap_cfg);
                flickr.map.on(["draw", "drag", "zoom_changed"], gmap_cfg.draw);
            }
        }
    });
}

function getMinMaxDates(zoom) {
    "use strict";

    // Get the earliest and latest times in the collection, and set the slider
    // range/handles appropriately.
    flickr.getMongoRange(flickr.config.server, flickr.config.db, flickr.config.coll, "datetaken", function (min, max) {
        var gmap_cfg,
            options,
            div;

        if (min === null || max === null) {
            d3.select("#map")
                .style("font-size", "14pt")
                .style("padding-top", "20%")
                .style("padding-left", "20%")
                .style("padding-right", "20%")
                .style("text-align", "center")
                .html("There doesn't seem to be a Mongo instance at <em>" + flickr.config.server + "</em>" +
                    ", with database <em>" + flickr.config.db + "</em> and collection <em>" + flickr.config.coll + "</em>" +
                    ", or there is no data there." +
                    "  See these <a href=\"http://tangelo.readthedocs.org/en/latest/setup.html#flickr-metadata-maps\">instructions</a> for help setting this up.");
            return;
        }

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
        retrieveData(true);

        // Add the 'retrieveData' behavior to the slider's onchange callback
        // (which starts out ONLY doing the 'displayFunc' part).
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
    flickr.map.trigger("draw");
}

window.onload = function () {
    "use strict";

    // Create control panel.
    $("#control-panel").controlPanel();

    tangelo.config("config.json", function (config, status, error) {
        var buttons,
            i,
            checkbox,
            dayboxes,
            popover_cfg,
            zoomfunc,
            redraw;

        if (status !== "OK") {
            tangelo.fatalError("flickr.js", "config.json file is required");
        } else if (!config["mongodb-server"] || !config["mongodb-db"] || !config["mongodb-coll"]) {
            tangelo.fatalError("flickr.js", "config.json must have 'mongodb-server', 'mongodb-db', and 'mongodb-coll' fields");
        }

        flickr.config = {};
        flickr.config.server = config["mongodb-server"];
        flickr.config.db = config["mongodb-db"];
        flickr.config.coll = config["mongodb-coll"];

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

        // This function is used to display the current state of the time
        // slider.
        flickr.displayFunc = (function () {
            var lowdiv,
                highdiv;

            lowdiv = d3.select("#low");
            highdiv = d3.select("#high");

            return function (low, high) {
                lowdiv.html(flickr.dateformat(new Date(low)));
                highdiv.html(flickr.dateformat(new Date(high)));
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

        // Direct the colormap selector radio buttons to redraw the map when
        // they are clicked.
        buttons = document.getElementsByName("colormap");
        redraw = function () {
            flickr.map.trigger("draw");
        };
        for (i = 0; i < buttons.length; i += 1) {
            buttons[i].onclick = redraw;
        }
        checkbox = document.getElementById("invert");
        checkbox.onclick = function () {
            flickr.map.trigger("draw");
        };

        // Direct the day filter checkboxes to redraw the map when clicked.
        dayboxes = flickr.dayNames.map(function (d) {
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

                    if (!d3.select("#unzoom").classed("disabled")) {
                        // Make sure this function is not being called when
                        // there are no entries in the stack.
                        if (stack.length === 0) {
                            tangelo.fatalError("unzoom button was clicked even though there is nothing to unzoom to.");
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
