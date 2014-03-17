/*jslint browser: true */
/*globals $, tangelo, d3 */

var app = {};
app.lyra = null;
app.timeline = null;
app.data = null;
app.range = null;

function computeRange(data) {
    "use strict";

    var k,
        fields = [],
        range = {};

    for (k in data[0]) {
        if (data[0].hasOwnProperty(k) && tangelo.isNumber(data[0][k])) {
            fields.push(k);
        }
    }

    range = {};
    $.each(fields, function (i, f) {
        var o = {};

        o.min = d3.min(data, function (d) {
            return d[f];
        });

        o.max = d3.max(data, function (d) {
            return d[f];
        });

        range[f] = o;
    });

    return range;
}

function createNew() {
    launchLyra({
        editor: true
    });
}

function edit() {
    launchLyra({
        editor: true,
        timeline: JSON.stringify(app.timeline)
    });
}

function shuffle() {
    var f;
    $.each(app.vega.data[0].values, function (i, d) {
        for (f in app.range) {
            if (app.range.hasOwnProperty(f)) {
                d[f] = app.range[f].min + Math.random() * (app.range[f].max - app.range[f].min);
            }
        }
    });

    refresh(app.vega);
}

function restore() {
    app.vega.data[0].values = $.extend(true, [], app.data);
    refresh(app.vega);
}

function refresh(vega) {
    vg.parse.spec(vega, function (chart) {
        chart({
            el: "#vega",
            renderer: "svg"
        }).update();

        d3.select("#edit")
            .attr("disabled", null);

        d3.select("#shuffle")
            .attr("disabled", null);

        d3.select("#restore")
            .attr("disabled", null);
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
    app.timeline = e.data.timeline;
    app.vega = e.data.vega;
    app.data = $.extend(true, [], e.data.vega.data[0].values);
    app.range = computeRange(app.data);

    refresh(app.vega);
    app.lyra = null;
}

$(function () {
    "use strict";

    window.addEventListener("message", receiveMessage, false);

    d3.select("#create")
        .on("click", createNew);

    d3.select("#edit")
        .on("click", edit);

    d3.select("#shuffle")
        .on("click", shuffle);

    d3.select("#restore")
        .on("click", restore);
});
