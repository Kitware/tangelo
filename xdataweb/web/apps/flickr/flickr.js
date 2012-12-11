flickr = {};
flickr.map = null;

flickr.getMongoDBInfo = function(){
    // Read in the config options regarding which MongoDB
    // server/database/collection to use.
    return { server: localStorage.getItem('flickr:mongodb-server') || 'localhost',
             db: localStorage.getItem('flickr:mongodb-db') || 'xdata',
             coll: localStorage.getItem('flickr:mongodb-coll') || 'flickr_paris' };
}

function getMinMaxDates(){
    var mongo = flickr.getMongoDBInfo();

    // Query the collection about the earliest and latest dates in the
    // collection.
    $.ajax({
        type: 'POST',
        url: '/service/mongo/' + mongo.server + '/' + mongo.db + '/' + mongo.coll,
        data: {
            sort: JSON.stringify([['date', 1]]),
            limit: 1,
            fields: JSON.stringify(['date'])
        },
        dataType: 'json',
        success: function(response){
            if(response.error !== null){
                // Error condition.
                console.log("error: could not get minimum time value from database.");
            }
            else{
                var val = +response.result[0]['date']['$date'];
                flickr.timeslider.setMin(val);
                flickr.timeslider.setLowValue(val);
            }
        }
    });

    $.ajax({
        type: 'POST',
        url: '/service/mongo/' + mongo.server + '/' + mongo.db + '/' + mongo.coll,
        data: {
            sort: JSON.stringify([['date', -1]]),
            limit: 1,
            fields: JSON.stringify(['date'])
        },
        dataType: 'json',
        success: function(response){
            if(response.error !== null){
                // Error condition.
                console.log("error: could not get maximum time value from database.");
            }
            else{
                var val = +response.result[0]['date']['$date'];
                flickr.timeslider.setMax(val);
                flickr.timeslider.setHighValue(val);
            }
        }
    });
}

function retrieveDataSynthetic(){
    // Generate a few lat/long values in well-known places.
    var chicago = [42.0, -87.5];
    var paris = [48.9, 2.3];
    var slc = [40.8, -111.9];
    var albany = [42.7, -73.8];
    var dhaka = [23.7, 90.4];
    var rio = [-22.9, -43.2];
    var wellington = [-41.3, 174.8];

    // Take the array of arrays, and map it to an array of google LatLng
    // objects.
    var locs = [chicago, paris, slc, albany, dhaka, rio, wellington].map(function(d) { return new google.maps.LatLng(d[0], d[1]); });

    // Store the retrieved values.
    flickr.map.locations(locs);

    // After data is reloaded to the map-overlay object, redraw the map.
    flickr.map.draw();
}

function retrieveData(){
    // Interrogate the UI elements to build up a query object for the database.
    //
    // Get the time slider range.
    var times = flickr.timeslider.getValue();

    // Construct a query that selects times between the two ends of the slider.
    var timequery = { $and : [{'date' : {$gte : {"$date" : times[0]}}},
                              {'date' : {$lte : {"$date" : times[1]}}}]
                    };

    // Get the hashtag text and split it into several tags.
    var hashtagText = d3.select("#hashtags").node().value;
    var hashtags = [];
    if(hashtagText !== ""){
        var hashtags = hashtagText.split(/\s+/);
    }

    // Construct a query to find any entry containing any of these tags.
    var hashtagquery = {};
    if(hashtags.length > 0){
        hashtagquery = { 'hashtags' : {$in : hashtags}};
    }

    // Stitch all the queries together into a "superquery".
    var query = {$and : [timequery, hashtagquery]};

    // Issue the query to the mongo module.
    var mongo = flickr.getMongoDBInfo();
    var panel = d3.select("#information")
                    .html("Querying database...");
    $.ajax({
        type: 'POST',
        url: '/service/mongo/' + mongo.server + '/' + mongo.db + '/' + mongo.coll,
        data: {
            query: JSON.stringify(query),
            limit: d3.select("#record-limit").node().value
        },
        dataType: 'json',
        success: function(response){
            // Error check.
            if(response.error !== null){
                console.log("fatal error: " + response.error);
                panel
                    .classed("error", true)
                    .html("fatal error: " + response.error);
                return;
            }

            // Report how many results there were.
            var N = response.result.length;
            panel.html("Got " + N + " result" + (N === 0 || N > 1 ? "s" : ""));

            // Process the data to add some interesting features
            //
            // Extract some information from the date.
            var data = response.result.map(function(d){
                var date = new Date(d.date.$date);

                d.month = date.getMonthName();
                d.day = date.getDayName();
                return d;
            });

            // Store the retrieved values in the map object.
            flickr.map.locations(data);

            // Redraw the map.
            flickr.map.draw();
        }
       });
}

function GMap(elem, options){
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

    var that = this;
    google.maps.event.addListener(this.map, "drag", function() { that.draw(); });
}

window.onload = function(){
    // TODO(choudhury): Probably the GMap prototype extension stuff should all
    // go in its own .js file.
    //
    // Equip ourselves with the overlay prototype.
    GMap.prototype = new google.maps.OverlayView();

    // Implement the callbacks for controlling the overlay.
    //
    // onAdd() signals that the map's panes are ready to receive the overlaid
    // DOM element.
    GMap.prototype.onAdd = function(){
        console.log("onAdd()!");

        // Grab the overlay mouse target element (because it can accept, e.g.,
        // mouse hover events to show SVG tooltips), wrap it in a D3 selection,
        // and add the SVG element to it.
        this.overlayLayer = this.getPanes().overlayMouseTarget;

        var svg = d3.select(this.overlayLayer).append("div")
            .attr("id", "svgcontainer")
            .style("position","relative")
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
    }

    // draw() sizes and places the overlaid SVG element.
    GMap.prototype.draw = function(){
        //console.log("draw()!");
        if(this.locationData === null || typeof this.locationData === 'undefined' || this.locationData.length === 0){
            console.log("returning early: locationData is " + this.locationData);
            return;
        }

        // Get the transformation from lat/long to pixel coordinates - the
        // lat/long data will be "pushed through" it just prior to being drawn.
        // It is deferred this way to deal with changes in the window size,
        // etc., that can occur without warning.
        var proj = this.getProjection();

        // Shift the container div to cover the "whole world".
        //
        // First, compute the pixel coordinates of the bounds of the "whole
        // world".
        var proj = this.getProjection();
        var low = proj.fromLatLngToDivPixel(new google.maps.LatLng(0,0));
        var high = proj.fromLatLngToDivPixel(new google.maps.LatLng(-85,180));
        var w = this.container.offsetWidth;
        var h = this.container.offsetHeight;
        //var topLeft = proj.fromContainerPixelToLatLng({x: 0, y: 0});
        //var center = flickr.map.map.getCenter();
        var containerLatLng = proj.fromContainerPixelToLatLng({x: 0, y: 0});
        var divPixels = proj.fromLatLngToDivPixel(containerLatLng);

        // TODO(choudhury): rather than throw in this Math.abs(), it would be
        // much better to figure out exactly when the high and low coordinates
        // become inverted.
        var svgwidth = Math.abs(2*(high.x - low.x));
        var svgheight = 2*(high.y - low.y);
        this.svgX = low.x - 0.5*svgwidth;
        this.svgY = low.y - 0.5*svgheight;

        // Adjustment factors to deal with world map wrapping at east and west.
        this.svgX -= 0;
        svgwidth += 0;

        // Move and resize the div element.
        var div = d3.select(this.overlayLayer).select("#svgcontainer");
        var newLeft = divPixels.x + "px";
        var newTop = divPixels.y + "px";
        div
            .style("left", newLeft)
            .style("top", newTop)
            .style("width", w + "px")
            .style("height", h + "px");

        // Resize the SVG element - now it covers "the whole world".
        var svg = d3.select(this.overlayLayer).select("svg");
        svg
            .attr("width", w)
            .attr("height", h);

        //// Make the rect element track the SVG element.
        //svg.select("#debugrect")
            //.attr("width", svg.attr("width"))
            //.attr("height", svg.attr("height"));

        // Process the data by adjoining pixel locations to each entry.
        var data = this.locationData.map(function(d){
            d.pixelLocation = proj.fromLatLngToDivPixel(new google.maps.LatLng(d.location[0], d.location[1]));
            d.pixelLocation.x -= divPixels.x;
            d.pixelLocation.y -= divPixels.y;
            return d;
        });

        // Select a colormapping function based on the radio buttons.
        var that = this;
        var color = (function(){
            // Empty the color legend div.
            d3.select("#legend").selectAll("*").remove();

            // Determine which radio button is currently selected.
            var which = $("input[name=colormap]:radio:checked").attr("value");

            // Generate a colormap function to return, and place a color legend
            // based on it.
            if(which === 'month'){
                var colormap = function(d){
                    return that.monthColor(d.month);
                };

                $.each(date.month_names, function(i, d){
                    var elemtext = d3.select(document.createElement("div"))
                        .style("border", "solid black 1px")
                        .style("background", colormap({'month': d}))
                        .style("display", "inline-block")
                        .style("width", "20px")
                        .html("&nbsp;")
                        .node().outerHTML;

                    var li = d3.select("#legend")
                        .append("li")
                        .html(elemtext + "&nbsp;" + d);
                });

                return colormap;
            }
            else if(which === 'day'){
                var colormap = function(d){
                    return that.dayColor(d.day);
                };

                $.each(date.day_names, function(i, d){
                    var elemtext = d3.select(document.createElement("div"))
                        .style("border", "solid black 1px")
                        .style("background", colormap({'day': d}))
                        .style("display", "inline-block")
                        .style("width", "20px")
                        .html("&nbsp;")
                        .node().outerHTML;

                    var li = d3.select("#legend")
                        .append("li")
                        .html(elemtext + "&nbsp;" + d);
                });

                return colormap;
            }
            else{
                return "pink";
            }
        })();

        // Compute a data join with the current list of marker locations, using
        // the MongoDB unique id value as the key function.
        var markers = d3.select(this.overlay)
            .select("#markers")
            .selectAll("circle")
            .data(data, function(d) { return d._id.$oid; });

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
            .attr("r", 10)
            .append("title")
            .text(function(d){
                var date = new Date(d.date.$date);
                var msg = "";
                msg += "Date: " + date.getDayName() + " " + date + "\n";
                msg += "Location: (" + d.location[0] + ", " + d.location[1] + ")\n";
                msg += "Author: " + d.author + "\n";
                msg += "Description: " + d.title + "\n";
                return msg;
            });

        markers
            .attr("cx", function(d) { return d.pixelLocation.x; })
            .attr("cy", function(d) { return d.pixelLocation.y; })
            .style("fill", color)
            .style("fill-opacity", 0.6)
            .style("stroke", "black")
            .transition()
            .duration(500)
            .style("opacity", 1.0);

        markers.exit()
            .transition()
            .duration(500)
            .style("opacity", 0.0)
            .remove();
    }

    // onRemove() destroys the overlay when it is no longer needed.
    GMap.prototype.onRemove = function(){
        // TODO(choudhury): implement this function by removing the SVG element
        // from the pane.
        console.log("onRemove()!");

    }

    GMap.prototype.locations = function(locationData){
        // TODO(choudhury): it might be better to actually copy the values here.
        //
        this.locationData = locationData;
        //this.locationData.length = 0;
        //for(var i=0; i<locationData.length; i++){
            //this.locationData.push(locationData[i]);
        //}
    }

    // Create a range slider for slicing by time.
    var displayFunc = (function(){
        var lowdiv = d3.select("#low");
        var highdiv = d3.select("#high");

        return function(low, high){
            lowdiv.html(new Date(low));
            highdiv.html(new Date(high));
        };
    })();

    flickr.timeslider = rangeSlider(d3.select("#time-slider").node(),
            {
                onchange: displayFunc,
                onslide: displayFunc
            });
    flickr.timeslider.initialize();

    // Attach an action to the "data" button.
    d3.select("#data-button").node().onclick = retrieveData;

    // Some options for initializing the google map.
    var options = {
        zoom: 2,
        center: new google.maps.LatLng(65.67, 95.17),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var div = d3.select("#map").node();
    flickr.map = new GMap(div, options);

    // Direct the colormap selector radio buttons to redraw the map when they
    // are clicked.
    var buttons = document.getElementsByName("colormap");
    for(var i=0; i<buttons.length; i++){
        buttons[i].onclick = function(){ flickr.map.draw(); };
    }

    // Get the earliest and latest times in the database, to create a suitable
    // range for the time slider.
    getMinMaxDates();

    // Attach actions to the zoom and unzoom buttons.
    var zoomfunc = (function(){
        var zoom = d3.select("#zoom");
        var unzoom = d3.select("#unzoom");

        var stack = [];

        return {
            zoomer: function(slider){
                // Return immediately if the handles are already at the bounds.
                var value = slider.getValue();
                var bounds = [slider.getMin(), slider.getMax()];
                if(value[0] == bounds[0] && value[1] == bounds[1]){
                    return;
                }

                // Save the current bounds on the stack.
                stack.push(bounds);

                // Set the bounds of the slider to be its current value range.
                slider.setMin(value[0]);
                slider.setMax(value[1]);

                // Activate the unzoom button if this is the first entry in the
                // stack.
                if(stack.length === 1){
                    unzoom.attr("disabled", null);
                }
            },

            unzoomer: function(slider){
                // Make sure this function is not being called when there are no
                // entries in the stack.
                if(stack.length === 0){
                   throw "Logic error: Unzoom button was clicked even though there is nothing to unzoom to.";
                }

                // Pop a bounds value from the stack, and set it as the bounds
                // for the slider.
                var bounds = stack.pop();
                slider.setMin(bounds[0]);
                slider.setMax(bounds[1]);

                // If the stack now contains no entries, disable the unzoom
                // button.
                if(stack.length === 0){
                    unzoom.attr("disabled", "disabled");
                }
            }
        };
    })();

    d3.select("#zoom")
        .data([flickr.timeslider])
        .on('click', zoomfunc.zoomer);

    d3.select("#unzoom")
        .data([flickr.timeslider])
        .on('click', zoomfunc.unzoomer);
}
