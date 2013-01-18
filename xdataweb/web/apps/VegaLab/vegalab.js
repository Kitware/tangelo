vegalab = {};

function url_exists(url){
    var http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status != 404;
}

function compile(){
    // Capture the Vega and Javascript code.
    var spectext = d3.select("#vega").node().value;
    var jstext = d3.select("#js").node().value;
    var datatext = d3.select("#data").node().value;

    // Create a JavaScript object out of the spec.
    //
    // TODO(choudhury): error checking for the eval call.
    try{
        spec = eval("(" + spectext + ")");
    }
    catch(e){
        console.log("error parsing Vega spec: " + e);
        return;
    }

    // Compile the Vega code into the template, and display it on the page.
    var source = vg.compile(spec, vegalab.template);
    d3.select("#code").node().value = source;

    // Eval the generated source, and capture the resulting function with a
    // name.
    eval("vegalab.make_chart = " + source + ";");

    // Eval the user Javascript, which should be just a function.  Default to
    // the function that does nothing.
    if(jstext.length > 0){
        try{
            eval("vegalab.js = " + jstext);
        }
        catch(e){
            console.log("error parsing user JavaScript: " + e);
            return;
        }
    }
    else{
        vegalab.js = function() {};
    }

    // The data window should contain either a function that returns the data to
    // be used, or a JSON object describing the data directly.  Capture the
    // data, either way.
    var data = null;
    if(datatext.length > 0){
        try{
            // Try to parse a JSON object from the data window.
            data = $.parseJSON(datatext);
        }
        catch(e){
            // Reaching here means the data window could not be parsed as JSON.
            // Try to parse it as JavaScript now.  The window should contain a
            // single function that returns a data value.
            try{
                eval("var d = " + datatext);

                // Call the d() function, and store the result.
                data = d();
            }
            catch(e){
                console.log("error parsing user data: " + e);
                return;
            }
        }
    }

    // Now that the data is ready, empty the container element, load the data,
    // bind the data, and initialize the chart.
    d3.select("#chart")
        .selectAll("*")
        .remove();
    vegalab.chart = vegalab.make_chart();
    vegalab.chart.load(function(){
        vegalab.chart.el("#chart").data(data).init().update();
    });

    // Call the user JavaScript code on the vega object.
    vegalab.js(vegalab.chart);
}

// A callback function for reading a selected file and pasting its contents into
// a textarea element.
function textplop(textarea_id){
    return function(e){
        // Grab the filename from the element.
        var file = d3.event.target.files[0];

        // Instantiate a file reader object, whose callback will simply plop
        // the text into the element.
        var reader = new FileReader();
        reader.onload = function(e){
            // Grab the text.
            var text = e.target.result;

            // Place it into the textarea element.
            d3.select("#" + textarea_id).node().value = text;
        };
        reader.readAsText(file);
    }
}

function loadspec(){
    // Check to see if it's the "dummy" option (which just states the name of
    // the pull down menu).
    var sel = d3.select("#load").node();
    if(sel.selectedIndex === 0){
        return;
    }

    // Grab the name of the option's associated directory.
    var opt = sel.options[sel.selectedIndex].id;

    // Issue ajax calls to fill the textarea elements with the contents of the
    // appropriate files.
    //
    // NOTE: the directory name is the same as the filename base.
    var filename_prefix = "/apps/VegaLab/examples/" + opt + "/" + opt;

    // Fill in the Vega spec text box.
    var filename = filename_prefix + ".json";
    if(url_exists(filename)){
        //d3.text(filename, function(text, err){
        d3.text(filename, function(err, text){
            if(err !== null){
                console.log("error: could not read Vega spec '" + filename + "'");
            }
            else{
                d3.select("#vega").node().value = text;
            }
        });
    }
    else{
        console.log("fatal error: Vega spec file '" + filename + "' does not exist");

        // Empty the textbox.
        d3.select("#vega").node().value = "";
    }

    // Fill in the JavaScript box.
    filename = filename_prefix + ".js";
    if(url_exists(filename)){
        d3.text(filename, function(err, text){
            if(err !== null){
                console.log("error: could not read JavaScript file '" + filename + "'");
            }
            else{
                d3.select("#js").node().value = text;
            }
        });
    }
    else{
        console.log("info/warning: JavaScript file '" + filename + "' does not exist");

        // Empty the textbox.
        d3.select("#js").node().value = "";
    }

    // Fill in the data box.
    //
    // Dispatch on the existence of a .js file or a .json file.
    if(url_exists(filename_prefix + "-data.js")){
        filename = filename_prefix + "-data.js";
        d3.text(filename, function(err, text){
            if(err !== null){
                console.log("error: could not read JavaScript file '" + filename + "'");
            }
            else{
                d3.select("#data").node().value = text;
            }
        });
    }
    else if(url_exists(filename_prefix + "-data.json")){
        filename = filename_prefix + "-data.json";
        d3.text(filename, function(err, text){
            if(err !== null){
                console.log("error: could not read JSON file '" + filename + "'");
            }
            else{
                d3.select("#data").node().value = text;
            }
        });
    }
    else{
        console.log("info/warning: neither JavaScript file '" + (filename_prefix + "-data.js") + "' nor JSON file '" + (filename_prefix + "-data.json") + "' exists");

        // Empty the textbox.
        d3.select("#data").node().value = "";
    }
}

window.onload = function(){
    // Load the Vega template text.
    d3.text("/lib/vgd3-template.js.txt", function(err, text){
        if(err !== null){
            console.log("fatal error: could not read vega template file '/lib/vgd3-template.js.txt'");
            return;
        }

        // Save the text.
        vegalab.template = text;

        // Now that the necessary data is loaded, install the actions on the
        // buttons.
        //
        // Install file upload handlers on the textarea buttons.
        d3.select("#vega_file")
            .on("change", textplop("vega"));

        d3.select("#js_file")
            .on("change", textplop("js"));

        d3.select("#data_file")
            .on("change", textplop("data"));

        // Install click handler for compile button, and enable the button.
        d3.select("#compile")
            .on("click", compile)
            .attr("disabled", null);
    });

    var examples = [
        {dir: 'histogram', optname: 'Data Histograms'},
        {dir: 'histogram-json', optname: 'JSON Data Histograms'},
        {dir: 'ordinal-bars', optname: 'Ordinal Bars'},
        {dir: 'vega-arc', optname: 'Arc (Vega)'},
        {dir: 'vega-bars', optname: 'Bars (Vega)'},
        {dir: 'vega-image', optname: 'Image (Vega)'},
        {dir: 'vega-line', optname: 'Line (Vega)'},
        {dir: 'vega-map', optname: 'Map (Vega)'},
        {dir: 'vega-stack_area', optname: 'Stacked Area (Vega)'},
        {dir: 'vega-stack_bars', optname: 'Stacked Bars (Vega)'},
        {dir: 'vega-symbol', optname: 'Symbol (Vega)'},
        {dir: 'vega-treemap', optname: 'Treemap (Vega)'}
    ];
    d3.select("#load")
        .on("change", loadspec)
        .selectAll("option")
        .data(examples, function(d){ return d === undefined ? "" : d.optname; })
        .enter()
        .append("option")
        .attr("id", function(d){
            return d.dir;
        })
        .html(function(d){
            return d.optname;
        });
};
