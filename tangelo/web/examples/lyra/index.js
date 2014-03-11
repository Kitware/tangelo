/*jslint browser: true */
/*globals $, tangelo, d3 */

var app = {};

function createNew() {
    console.log("createNew");
    launchLyra();
}

function edit() {
    console.log("edit");
}

function launchLyra() {
    app.lyra = window.open("/lyra/editor.html", "_blank");
}

function receiveMessage(e) {
    console.log(e.data);

    vg.parse.spec(e.data, function (chart) {
        chart({
            el: "#vega",
            renderer: "svg"
        }).update();
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
