/*jslint browser: true */

/*globals d3 */

var config = null;

function current(s) {
    "use strict";

    return s + "-current";
}

function tag(s) {
    "use strict";

    return "#" + s;
}

function update() {
    "use strict";

    var server,
        db,
        coll;

    // Grab the elements.
    server = document.getElementById("mongodb-server");
    db = document.getElementById("mongodb-db");
    coll = document.getElementById("mongodb-coll");

    // Read the options into DOM storage.
    localStorage.setItem('flickr:mongodb-server', server.value);
    localStorage.setItem('flickr:mongodb-db', db.value);
    localStorage.setItem('flickr:mongodb-coll', coll.value);

    // Reload the current values into the display elements.
    window.onload();
}

window.onload = function () {
    "use strict";

    var server,
        db,
        coll;

    // Grab the current config values from DOM storage, or use default values if
    // they are missing.
    server = localStorage.getItem('flickr:mongodb-server') || 'localhost';
    db = localStorage.getItem('flickr:mongodb-db') || 'xdata';
    coll = localStorage.getItem('flickr:mongodb-coll') || 'flickr_paris';

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
};
