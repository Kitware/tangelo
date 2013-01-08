// Global namespace container.
stats = {};

// Some characteristics of the dataset under consideration.
stats.start = null;
stats.end = null;
stats.count = null;

// The JavaScript template to use for compiling the vis spec into.
stats.vistemplate = null;

// Variables needed for implementing click-drag actions.
stats.dragging = {};
stats.dragging.on = false;
stats.dragging.last = [-1,-1];
stats.dragging.from = -1;

// Data.
stats.data = {};

// A visualization spec template for generating a bar chart for the histogram
// values.
stats.spec = {
    name: "histogram",
    width: 800,
    height: 400,
    padding: {top: 30, bottom: 30, left: 35, right: 30},
    data: [
        {name: "values"}
    ],
    scales: [
        {name: "x", type: "ordinal", domain: {data: "values", field: "bin"}, range: "width", padding: 0},
        {name: "y", type: "linear", domain: [0,1], range: "height"}
    ],
    axes: [
        {axis: "x", scale: "x", values: []},
        {axis: "y", scale: "y"}
    ],
    marks: [
        {
            type: "rect",
            name: "histogram_bars",
            from: "values",
            enter: {
                x1: {scale: "x", field: "bin"},
                y1: {scale: "y", field: "value"},
                y2: {scale: "y", value: 0},
                width: {scale: "x"},
                fill: {value: "darkgreen"}
            }
        },

        {   type: "rect",
            name: "histogram_bar_containers",
            from: "values",
            enter: {
                x1: {scale: "x", field: "bin"},
                width: {scale: "x"},
                y1: {scale: "y", value: 0},
                y2: {scale: "y", value: 1},
                fill: {value: "black"},
                opacity: {value: 0.0}
            }
        }
    ]
};

function static_histogram(start, end, bins, sel, empty, extra_update_template){
    // Grab the chart container element.
    var chart = d3.select(sel);

    // Calculate the ranges of data.
    var binsize = (end - start) / bins;
    var ranges = [];
    for(var i=0; i<bins+1; i++){
        ranges.push(start + i*binsize);
    }

    // Create an empty array of histogram values.
    stats.data.values = new Array(bins);

    // Perform lookups to get counts of data for these regions.
    //
    // First, design a callback that must be called "bins" times before it does
    // its actual work.
    var make_chart = (function(){
        var trigger = 1;

        return function(data){
            // This mechanism causes the function's bulk not to execute until
            // all of the AJAX calls have completed (i.e., until the function is
            // called "bins" times, it will simply return early).
            if(trigger != bins){
                trigger += 1;
                return;
            }

            // Empty the container if requested.
            empty = empty || false;
            if(empty){
                chart.selectAll("*")
                    .remove();
            }

            // Compile the spec into the template.
            var source = vg.compile(stats.spec, stats.vistemplate);
            
            // Insert the "extra update" code, to include title elements
            // attached to the rect elements.
            var code = extra_update_template.replace("<<DATA>>", JSON.stringify(data));
            source = source.replace("{{EXTRA_UPDATE}}", code);

            d3.select("#code").text(source);
            eval("stats.chart = " + source +";");
            stats.vis = stats.chart();
            stats.vis.el(sel).data(stats.data).init().update().extraUpdate();
        };
    })();

    // A callback function generator (this cannot be embedded in the loop below
    // because of the weird way JavaScript binds the loop variable to its
    // mention within the function body).
    var callback_maker = function(which){
        return function(response){
            if(response.error !== null){
                    console.log("error: could not complete database request for range " + which);
                    console.log(response.error);
                    return;
            }

            // Store the percentile range and number of records in the proper
            // slot, and signal to the callback function that this AJAX call
            // succeeded.
            stats.data.values[which] = {
                bin: (which + 1) / bins,
                count: +response.result.count,
                value: +response.result.count / stats.count
            };

            make_chart(stats.data.values);
        };
    }

    // Now, fire several AJAX calls to retrieve the number of records existing
    // in each range.
    for(i=0; i<bins; i++){
        $.ajax({
            url: '/service/mongo/mongo/xdata/flickr_paris',
            data: {
                query: JSON.stringify({date: {$gte : {$date : ranges[i]}, $lt: {$date : ranges[i+1]}} }),
                limit: "0",
                fill: false
            },
            dataType: 'json',
            success: callback_maker(i)
        });
    }
}

window.onload = function(){
    // Load the data.
    //
    // First get the extremes of the data.
    $.ajax({
        url: '/service/mongo/mongo/xdata/flickr_paris',
        data: {
            sort: JSON.stringify([['date',1]]),
            fields: JSON.stringify(['date']),
            limit: 1
        },
        dataType: 'json',
        success: function(response){
            if(response.error !== null){
                console.log("error: could not get earliest time record");
                console.log(response.error);
                return;
            }

            // Capture the date by extracting the millisecond value and
            // converting it to a numeric type.
            stats.start = +response.result.data[0].date.$date;

            // Trigger an AJAX call to get the *latest* date in the dataset.
            $.ajax({
                url: '/service/mongo/mongo/xdata/flickr_paris',
                data: {
                    sort: JSON.stringify([['date', -1]]),
                    fields: JSON.stringify(['date']),
                    limit: 1
                },
                dataType: 'json',
                success: function(response){
                    if(response.error !== null){
                        console.log("error: could not get latest time record");
                        console.log(response.error);
                        return;
                    }

                    // Capture the date.
                    stats.end = +response.result.data[0].date.$date;

                    // Now fire an AJAX call to count the total number of
                    // records.
                    $.ajax({
                        url: '/service/mongo/mongo/xdata/flickr_paris',
                        data: {
                            limit: 0,
                            fill: false
                        },
                        dataType: 'json',
                        success: function(response){
                            if(response.error !== null){
                                console.log("error: could not count the number of records in the database");
                                console.log(response.error);
                                return;
                            }

                            // Save the count.
                            stats.count = +response.result.count;
                            
                            // Fire an AJAX call to retrieve the Vega template
                            // text.
                            d3.text("/lib/vgd3-template.js.txt", function(text){
                                // Grab the text.
                                stats.vistemplate = text;

                                // Fire an AJAX call to grab the "extra update"
                                // template text (for use in constructing the
                                // vis object from the Vega spec).
                                d3.text("extra-update.template.js", function(text, error){
                                    // Check for error.
                                    if(text === undefined){
                                        console.log("error: " + error);
                                        return;
                                    }

                                    // Grab the text.
                                    stats.extraupdate_template = text;

                                    // Finally - now that we have all the stuff we
                                    // need - initialize the buttons.
                                    d3.select("#quartile").node().onclick = function(){
                                        static_histogram(stats.start, stats.end, 4, "#chart", true, stats.extraupdate_template);
                                    };

                                    d3.select("#decile").node().onclick = function(){
                                        static_histogram(stats.start, stats.end, 10, "#chart", true, stats.extraupdate_template);
                                    };

                                    d3.select("#percentile").node().onclick = function(){
                                        static_histogram(stats.start, stats.end, 100, "#chart", true, stats.extraupdate_template);
                                    };
                                });
                            });
                        }
                    });
                }
            });
        }
    });
};
