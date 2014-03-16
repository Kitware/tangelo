/*jslint browser: true */
/*globals $, tangelo, d3 */

var app = {};
app.lyra = null;
app.loaded = null;

function createNew() {
    launchLyra({
        editor: true,
        savefile: new Date().toString()
    });
}

function edit() {
    launchLyra({
        editor: true,
        loadfile: app.filename,
        savefile: new Date().toString()
    });
}

function launchLyra(qargs) {
    var query = $.param(qargs || {});
    if (query.length > 0) {
        query = "?" + query;
    }

    app.lyra = window.open("/lyra/editor.html" + query, "_blank");
}

function receiveMessage(e) {
    vg.parse.spec(e.data.vega, function (chart) {
        chart({
            el: "#vega",
            renderer: "svg"
        }).update();

        d3.select("#edit")
            .attr("disabled", null);

        app.filename = e.data.filename;

        app.lyra = null;
    });
}

$(function () {
    "use strict";

    window.addEventListener("message", receiveMessage, false);

    d3.select("#create")
        .on("click", createNew);

    d3.select("#edit")
        .on("click", edit);
});
