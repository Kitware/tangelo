vegalab = {};

function compile(){
    // Capture the Vega and Javascript code.
    var spec = d3.select("#vega").node().value;
    var js = d3.select("#js").node().value;

    // Create a JavaScript object out of the spec.
    //
    // TODO(choudhury): error checking for the eval call.
    spec = eval("(" + spec + ")");

    // Compile the Vega code into the template, and display it on the page.
    var source = vg.compile(spec, vegalab.template);
    d3.select("#code")
        .text(source);

    // Eval the generated source, and capture the resulting function with a
    // name.
    eval("vegalab.make_chart = " + source + ";");

    // Create a visualization by calling the function.
    vegalab.chart = vegalab.make_chart();
    vegalab.chart.el("#chart");

    // Eval the user Javascript, which should be just an object with properties
    // named "data" and "extra".
    vegalab.js = eval("(" + js + ")");

    // The "data" property should contain a function that returns the data to be
    // used with the visualization.
    if(vegalab.js.data !== undefined){
        vegalab.chart.data(vegalab.js.data());
    }
    else{
        console.log("warning: no 'data' function in javascript code");
    }

    // Now that the data is ready, create the chart.
    vegalab.chart.init().update();

    // The "extra" property should contain a function that takes a Vega
    // visualization as an input and performs some extra work on it (to
    // implement interactin behavior, etc.).
    if(vegalab.js.extra !== undefined){
        vegalab.js.extra(vegalab.chart);
    }
    else{
        console.log("warning: no 'extra' function in javascript code");
    }
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
            d3.select("#" + textarea_id)
                .text(text);
        };
        reader.readAsText(file);
    }
}

window.onload = function(){
    // Load the Vega template text.
    d3.text("/lib/vgd3-template.js.txt", function(text){
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
};
