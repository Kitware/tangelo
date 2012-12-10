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

function retrieveData(){
    // TODO(choudhury): replace the following code with code to collect together
    // the filtering operations from the various UI elements on the page, then
    // issue a database search command to retrieve the appropriate location
    // data.

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
    //
    flickr.map.draw();
    //flickr.map.refresh();
}

function GMap(elem, options){
    // Create the map object and place it into the specified container element.
    this.map = new google.maps.Map(elem, options);

    // Record the container element.
    this.container = elem;

    // Store a null 'overlay' property, which will be filled in with a
    // transparent SVG element when the overlay is sized and placed in the
    // draw() callback.
    this.overlay = null;

    this.setMap(this.map);
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

        // Grab the overlay layer element, wrap it in a D3 selection, and add
        // the SVG element to it.
        var overlayLayer = this.getPanes().overlayLayer;
        var svg = d3.select(overlayLayer).append("svg")
            .style("fill", "white")
            .attr("width", this.container.offsetWidth)
            .attr("height", this.container.offsetHeight);

        svg.append("rect")
            .style("fill-opacity", 0.4)
            .style("fill", "white")
            .style("stroke", "black")
            .attr("width", svg.attr("width"))
            .attr("height", svg.attr("height"));

        svg.append("g")
            .attr("id", "markers");

        // Record the SVG element in the object for later use.
        this.overlay = svg.node();
    }

    // draw() sizes and places the overlaid SVG element.
    GMap.prototype.draw = function(){
        console.log("draw()!");
        if(this.locs === null || typeof this.locs === 'undefined'){
            return;
        }

        // Get the transformation from lat/long to pixel coordinates - the
        // lat/long data will be "pushed through" it just prior to being drawn.
        // It is deferred this way to deal with changes in the window size,
        // etc., that can occur without warning.
        var proj = this.getProjection();

        // Compute a data-join with the current list of marker locations.
        //
        // NOTE: the goofy key function here is due to the fact that
        // JavaScript's equality operator only tests arrays for equality by
        // underlying pointer, NOT by value.  An easy way to circumvent the
        // restriction is to convert the arrays to JSON strings, and compare
        // those.
        var markers = d3.select(this.overlay)
            .select("#markers")
            .selectAll("circle")
            .data(this.locs.map(function(d) { return proj.fromLatLngToDivPixel(d); }), function(d) { return JSON.stringify(d); });

        // For the enter selection, create new circle elements, then fade them
        // in.  Fade out circles in the exit selection.  There is no need to
        // handle the update selection, as those markers are already visible,
        // and already where they are supposed to be.
        var that = this;
        markers.enter()
            .append("circle")
            .style("fill", "pink")
            .style("fill-opacity", 0.6)
            .style("stroke", "red")
            .style("opacity", 0.0)
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            .attr("r", 25)
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

    GMap.prototype.locations = function(locs){
        // TODO(choudhury): it might be better to actually copy the values here.
        this.locs = locs;
    }

    GMap.prototype.refresh = function(){
        this.setMap(this.map);
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
        zoom: 3,
        center: new google.maps.LatLng(65.67, 95.17),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var div = d3.select("#map").node();
    flickr.map = new GMap(div, options);

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
