// Global namespace container.
stats = {};

// Some characteristics of the dataset under consideration.
stats.start = null;
stats.end = null;
stats.count = null;

// Some stacks to store earlier versions of those values (for recovering older
// visualization state).
stats.bounds = [];
stats.counts = [];

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

function static_histogram(start, end, bins, sel, empty){
    // Record the current number of bins.
    stats.bins = bins;

    // Record the start and end values in the stack.
    stats.bounds.push([start, end]);

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

        chart.append('div')
            .attr("id", "chart_progress");

        return function(){
            // This mechanism causes the function's bulk not to execute until
            // all of the AJAX calls have completed (i.e., until the function is
            // called "bins" times, it will simply return early).
            if(trigger != bins){
                trigger += 1;

                chart.select("#chart_progress")
                    .html("Received " + trigger + " of " + bins + " responses");

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
            
            d3.select("#code").text(source);
            eval("stats.chart = " + source +";");
            stats.vis = stats.chart();
            stats.vis.el(sel).data(stats.data).init().update();
            extraUpdate(stats.vis, bins);
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

            make_chart();
        };
    };

    // Now, fire several AJAX calls to retrieve the number of records existing
    // in each range.
    for(i=0; i<bins; i++){
        var mongostring = JSON.stringify({date: {$gte : {$date : ranges[i]}, $lt: {$date : ranges[i+1]}} });
        $.ajax({
            url: '/service/mongo/mongo/xdata/flickr_paris',
            data: {
                query: mongostring,
                limit: "0",
                fill: false
            },
            dataType: 'json',
            success: callback_maker(i)
        });
    }
}

function extraUpdate(v, bins){
    // Grab a reference to the containing DOM element for the visualization.
    var dom = d3.select(v.el());

    var bardata = new Array(bins);
    var format = d3.format('%');
    var data = v.data().values;
    for(var i=0; i<bins; i++){
        bardata[i] = {};
        bardata[i].title = format(i/bins) + ' - ' + format((i+1)/bins) + ' (' + format(data[i].value) + ' or ' + data[i].count + ' records)';
        bardata[i].state = 'unselected';
    }
    var containers = dom.select('.mark-1').selectAll('rect');
    containers.data(bardata).append('title').text(function(d) { return d.title; });

    function select(d){
        d.state = 'selected';
        return d;
    }

    function unselect(d){
        d.state = 'unselected';
        return d;
    }

    containers.on('mouseover', function(d, i){
        var bar = d3.select(this);
        if(d.state == 'selected'){
            bar.style('fill', 'red')
        .style('opacity', 0.5);
        }
        else if(d.state == 'unselected'){
            bar.style('fill', 'black')
        .style('opacity',0.3);
        }
        else{
            console.log("d.state must be selected or unselected - was " + d.state);
            throw 0;
        }

    if(stats.dragging.on){
        var target = -1;
        if(i < stats.dragging.left){
            // Dragging outside the pack, to the left.
            for(var j=i; j<=stats.dragging.left; j++){
                var e = d3.select(containers[0][j]);
                e.style('opacity', 0.3)
                    .style('fill', 'red')
                    .datum(select);
            }
            stats.dragging.left = i;
            stats.dragging.from = 0;
        }
        else if(i > stats.dragging.right){
            // Dragging outside the pack, to the right.
            for(var j=stats.dragging.right+1; j<=i; j++){
                var e = d3.select(containers[0][j]);
                e.style('opacity', 0.3)
                    .style('fill', 'red')
                    .datum(select);
            }
            stats.dragging.right = i;
            stats.dragging.from = 1;
        }
        else{
            // Dragging inside the pack.
            if(stats.dragging.from === 0){
                // Shrinking the selection from the left.
                for(var j=stats.dragging.left; j<i; j++){
                    var e = d3.select(containers[0][j]);
                    e.style('opacity', 0.0)
                        .style('fill', 'black')
                        .datum(unselect);
                }
                stats.dragging.left = i;
            }
            else if(stats.dragging.from === 1){
                // Shrinking the selection from the right.
                for(var j=i+1; j<=stats.dragging.right; j++){
                    var e = d3.select(containers[0][j]);
                    e.style('opacity', 0.0)
                        .style('fill', 'black')
                        .datum(unselect);
                }
                stats.dragging.right = i;
            }
            else{
                console.log("error - stats.dragging.from must be 0 or 1");
                throw 0;
            }
        }
    }
    });

    containers.on('mouseout', function(d){
        if(!stats.dragging.on){
            if(d.state === 'unselected'){
                d3.select(this).style('opacity',0.0);
            }
            else if(d.state === 'selected'){
                d3.select(this).style('opacity',0.3);
            }
        }
    });

    function mousedown(d, i){
        stats.dragging.on = true;
        stats.dragging.left = stats.dragging.right = i;
        stats.dragging.from = -1;

        containers.style('opacity', 0.0)
            .datum(unselect);

        d3.select(containers[0][i])
            .style('fill', 'red')
            .style('opacity', 0.3)
            .datum(select);
    }

    function mouseup(d, i){
        stats.dragging.on = false;

        // Compute the new value limits to use.  Once this is done, the buttons will
        // reference the new ranges.
        var binwidth = (stats.end - stats.start) / stats.bins;
        var oldstart = stats.start;
        stats.start = oldstart + stats.dragging.left*binwidth;
        stats.end = oldstart + (stats.dragging.right+1)*binwidth;
    }

    containers.on('mousedown', mousedown);
    containers.on('mouseup', mouseup);
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

                                // Finally - now that we have all the stuff
                                // we need - initialize the buttons.
                                d3.select("#quartile").attr("disabled", null)
                                .node().onclick = function(){
                                    static_histogram(stats.start, stats.end, 4, "#chart", true, stats.extraupdate_template);
                                };

                            d3.select("#decile").attr("disabled", null)
                                .node().onclick = function(){
                                    static_histogram(stats.start, stats.end, 10, "#chart", true, stats.extraupdate_template);
                                };

                            d3.select("#percentile").attr("disabled", null)
                                .node().onclick = function(){
                                    // The call is wrapped in a lambda to
                                    // allow stats.start and stats.end to
                                    // bind dynamically.
                                    (function(){
                                        static_histogram(stats.start, stats.end, 100, "#chart", true, stats.extraupdate_template);
                                    })();
                                };
                            });
                        }
                    });
                }
            });
        }
    });
};
