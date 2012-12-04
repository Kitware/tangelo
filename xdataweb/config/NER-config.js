config = null;

function update(){
    // Fill in the config object with the input field data.
    //config['mongodb-server'] = d3.select("#mongodb-server").attr("value");
    config['mongodb-server'] = document.getElementById("mongodb-server").value;

    // Store the object in DOM storage.
    console.log("updating with: " + JSON.stringify(config));
    localStorage.setItem('NER', JSON.stringify(config)); 

    // TODO(choudhury):  The page should either reload here, or else the
    // "current" values should all be updated.
}

window.onload = function(){
    // Grab the current config values from DOM storage, or use default values if
    // they are missing.
    config = JSON.parse(localStorage.getItem('NER') || "{}");
    var mongodb = config['mongodb-server'] || 'localhost';

    // Fill in the table with the current information.
    d3.select("#mongodb-server-current")
        .html(mongodb);
    d3.select("#mongodb-server")
        .attr("value", mongodb);
}
