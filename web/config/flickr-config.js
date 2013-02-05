config = null;

function current(s){
    return s + "-current";
}

function tag(s){
    return "#" + s;
}

function update(){
    // Grab the elements.
    var server = document.getElementById("mongodb-server");
    var db = document.getElementById("mongodb-db");
    var coll = document.getElementById("mongodb-coll");

    // Read the options into DOM storage.
    localStorage.setItem('flickr:mongodb-server', server.value);
    localStorage.setItem('flickr:mongodb-db', db.value);
    localStorage.setItem('flickr:mongodb-coll', coll.value);

    // Reload the current values into the display elements.
    window.onload();
}

window.onload = function(){
    // Grab the current config values from DOM storage, or use default values if
    // they are missing.
    var server = localStorage.getItem('flickr:mongodb-server') || 'localhost';
    var db = localStorage.getItem('flickr:mongodb-db') || 'xdata';
    var coll = localStorage.getItem('flickr:mongodb-coll') || 'flickr_paris';

    // Fill in the table with the current information.
    d3.select("#mongodb-server-current")
        .html(server);
    d3.select("#mongodb-server")
        .attr("value", server);

    d3.select("#mongodb-db-current")
        .html(db);
    d3.select("#mongodb-db")
        .attr("value", db);

    d3.select("#mongodb-coll-current")
        .html(coll);
    d3.select("#mongodb-coll")
        .attr("value", coll);
}
