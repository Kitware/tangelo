/*globals d3, _, $, tangelo, geo */

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

flickr.refreshMap = function () {
    "use strict";

    var days,
        data,
        N,
        color,
        radius,
        opacity;

    data = flickr.locationData.slice();

    days = _.filter(flickr.dayNames, function (d) {
        return document.getElementById(d).checked;
    });

    if (days.length > 0) {
        data = _.filter(flickr.locationData, function (d) {
            return days.indexOf(d.day) !== -1;
        });
    }

    N = flickr.locationData.length === 1 ? 2 : flickr.locationData.length;

    color = (function () {
        var which,
            colormap,
            retval,
            invert,
            range,
            scale;

        // Determine which radio button is currently
        // selected.
        which = $("input[name=colormap]:radio:checked").attr("id");

        // Generate a colormap function to return, and place a color legend
        // based on it.
        if (which === "month") {
            colormap = function (d) {
                return flickr.monthColor(d.month);
            };

            $(flickr.legend).svgColorLegend({
                cmapFunc: flickr.monthColor,
                xoffset: $(window).width() - 100,
                yoffset: 50,
                categories: flickr.monthNames,
                heightPadding: 5,
                widthPadding: 7,
                textSpacing: 19,
                legendMargins: {
                    top: 5,
                    left: 5,
                    bottom: 5,
                    right: 5
                },
                clear: true
            });

            retval = colormap;
        } else if (which === "day") {
            colormap = function (d) {
                return flickr.dayColor(d.day);
            };

            $(flickr.legend).svgColorLegend({
                cmapFunc: flickr.dayColor,
                xoffset: $(window).width() - 100,
                yoffset: 50,
                categories: flickr.dayNames,
                heightPadding: 5,
                widthPadding: 7,
                textSpacing: 19,
                legendMargins: {top: 5, left: 5, bottom: 5, right: 5},
                clear: true
            });

            retval = colormap;
        } else if (which === "rb") {
            d3.select(flickr.legend)
                .selectAll("*")
                .remove();

            invert = document.getElementById("invert").checked;
            range = invert ? ["blue", "red"] : ["red", "blue"];
            scale = d3.scale.linear()
                .domain([0, N - 1])
                .range(range);

            retval = function (d, i) {
                return scale(i);
            };
        } else {
            d3.select(flickr.legend)
                .selectAll("*")
                .remove();

            retval = "pink";
        }

        return retval;
    }());

    radius = (function () {
        var which,
            retval,
            size;

        // Determine which radio button is selected.
        which = $("input[name=size]:radio:checked").attr("id");

        // Generate a radius function to return.
        if (which === "recency") {
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

    opacity = flickr.opacityslider.slider("value") / 100;

    flickr.dots.data(data)
        .position(function (d) {
            var loc = {
                x: d.location[0],
                y: d.location[1]
            };

            return loc;
        })
        .style("radius", radius)
        .style("fillColor", color)
        .style("strokeColor", "black")
        .style("fillOpacity", opacity)
        .style("strokeWidth", 1)
        .draw();

    flickr.dots.select()
        .style("cursor", "crosshair")
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
            $(this).popover(cfg);
        });

    flickr.map.draw();
};

flickr.getMongoRange = function (host, db, coll, field, callback) {
    "use strict";

    var min,
        max,
        mongourl;

    // The base URL for both of the mongo service queries.
    mongourl = "/plugin/mongo/mongo/" + host + "/" + db + "/" + coll;

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
        },
        error: function () {
            callback(null, null);
        }
    });
};

function retrieveData() {
    "use strict";

    var times,
        timequery,
        hashtagText,
        hashtags,
        hashtagquery,
        query;

    // Interrogate the UI elements to build up a query object for the database.
    //
    // Get the time slider range.
    times = flickr.timeslider.slider("values");

    // Construct a query that selects times between the two ends of the slider.
    timequery = {
        $and: [{datetaken: {$gte: {$date: times[0]}}},
               {datetaken: {$lte: {$date: times[1]}}}]
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
        hashtagquery = {hashtags: {$in: hashtags}};
    }

    // Stitch all the queries together into a "superquery".
    query = {$and: [timequery, hashtagquery]};

    // Enable the abort button and issue the query to the mongo module.
    d3.select("#abort")
        .classed("btn-success", false)
        .classed("btn-danger", true)
        .classed("disabled", false)
        .html("Abort query <img src=wait.gif>");

    flickr.currentAjax = $.ajax({
        type: "POST",
        url: "/plugin/mongo/mongo/" + flickr.config.server + "/" + flickr.config.db + "/" + flickr.config.coll,
        data: {
            query: JSON.stringify(query),
            limit: d3.select("#record-limit").node().value,
            sort: JSON.stringify([["datetaken", 1]])
        },
        dataType: "json",
        success: function (response) {
            var N,
                data;

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

            flickr.refreshMap();
        }
    });
}

function getMinMaxDates(zoom) {
    "use strict";

    // Get the earliest and latest times in the collection, and set the slider
    // range/handles appropriately.
    flickr.getMongoRange(flickr.config.server, flickr.config.db, flickr.config.coll, "datetaken", function (min, max) {
        var div,
            html;

        if (min === null || max === null) {
            // Unhide the error message and fill in the runtime details.
            div = d3.select("#map")
                .select("div");

            html = div.html()
                .replace("%server%", flickr.config.server)
                .replace("%db%", flickr.config.db)
                .replace("%coll%", flickr.config.coll);

            div.style("display", null)
                .html(html);

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
        retrieveData();

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

        // Create a GeoJS map object.
        flickr.map = geo.map({
            node: "#map",
            center: {
                x: 2.33,
                y: 48.86
            },
            zoom: 11
        });

        flickr.map.createLayer("osm", {
            baseUrl: "http://otile1.mqcdn.com/tiles/1.0.0/map/"
        });

        $(window).resize(function () {
            var map = flickr.map;
            map.resize(0, 0, map.node().width(), map.node().height());
        });

        flickr.dots = flickr.map.createLayer("feature", {
            renderer: "d3Renderer"
            // renderer: "vglRenderer"
        })
            .createFeature("point")
            .data([]);

        flickr.legend = flickr.map.createLayer("feature", {
            renderer: "d3Renderer",
            sticky: false
        })
            .canvas()
            .append("g")
            .node();
    });
}

window.onload = function () {
    "use strict";

    // Create control panel.
    $("#control-panel").controlPanel();

    tangelo.plugin.config.config("config.yaml", true, function (config) {
        var buttons,
            i,
            checkbox,
            dayboxes,
            popoverCfg,
            zoomfunc,
            redraw;

        if (!config["mongodb-server"] || !config["mongodb-db"] || !config["mongodb-coll"]) {
            throw new Error("config.yaml must have 'mongodb-server', 'mongodb-db', and 'mongodb-coll' fields");
        }

        flickr.config = {};
        flickr.config.server = config["mongodb-server"];
        flickr.config.db = config["mongodb-db"];
        flickr.config.coll = config["mongodb-coll"];

        flickr.timeslider = $("#time-slider");

        // Enable the popover help items.
        //
        // First create a config object with the common options preset.
        popoverCfg = {
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
        popoverCfg.title = "Time Filtering";
        popoverCfg.content = "Display photos taken between two particular dates/times.<br><br>" +
            "The 'zoom to range' button will make the slider represent the currently selected time slice, " +
            "while the 'unzoom' button undoes one zoom.";
        $("#time-filter-help").popover(popoverCfg);

        // Hashtag help.
        popoverCfg.title = "Hashtag Filtering";
        popoverCfg.content = "Display photos including the list of hashtags specified.  Be sure to include the initial '#'!";
        $("#hashtag-filter-help").popover(popoverCfg);

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
            flickr.refreshMap();
        };
        for (i = 0; i < buttons.length; i += 1) {
            buttons[i].onclick = redraw;
        }
        checkbox = document.getElementById("invert");
        checkbox.onclick = function () {
            flickr.refreshMap();
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
                    value = slider.slider("values");
                    bounds = [slider.slider("option", "min"), slider.slider("option", "max")];
                    if (value[0] === bounds[0] && value[1] === bounds[1]) {
                        return;
                    }

                    // Save the current bounds on the stack.
                    stack.push(bounds);

                    // Set the bounds of the slider to be its current value range.
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
                        slider.slider("option", "min", bounds[0]);
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
            .on("click", zoomfunc.zoomer);

        d3.select("#unzoom")
            .data([flickr.timeslider])
            .on("click", zoomfunc.unzoomer);

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
