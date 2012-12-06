config = null;

function update(){
    // Read the options into DOM storage.
    localStorage.setItem('NER:mongodb-server', document.getElementById("mongodb-server").value);

    // TODO(choudhury):  The page should either reload here, or else the
    // "current" values should all be updated.
}

window.onload = function(){
    // Grab the current config values from DOM storage, or use default values if
    // they are missing.
    var mongodb = localStorage.getItem('NER:mongodb-server') || 'localhost';

    // Fill in the table with the current information.
    d3.select("#mongodb-server-current")
        .html(mongodb);
    d3.select("#mongodb-server")
        .attr("value", mongodb);
}
