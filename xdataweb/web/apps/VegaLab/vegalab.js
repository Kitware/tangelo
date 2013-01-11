vegalab = {};

function compile(){

}

// A callback function for reading a selected file and pasting its contents into
// a textarea element.
function textplop(textarea_id){
    return function(e){
        // Grab the filename from the element.
        var file = d3.event.target.files[0];

        // Instantiate a file reader object, whose callback will simply plop
        // the text into the element.
        var reader = FileReader();
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
        vegalab.vega_template = text;

        // Now that the necessary data is loaded, install the actions on the
        // buttons.
        //
        // Install file upload handlers on the textarea buttons.
        d3.select("#vega_file")
            .on("change", textplop("vega"));

        d3.select("#js_file")
            .on("change", textplop("js"));

        // Install click handler for compile button, and enable the button.
        d3.select("#compile")
            .on("click", compile)
            .attr("disabled", null);
    });
};
