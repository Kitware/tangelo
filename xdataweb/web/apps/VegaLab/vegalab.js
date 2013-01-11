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
    // Install file upload handlers on the textarea buttons.
    d3.select("#vega_file")
        .on("change", textplop("vega"));

    d3.select("#js_file")
        .on("change", textplop("js"));
};
