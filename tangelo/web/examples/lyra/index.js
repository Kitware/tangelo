/*jslint browser: true */
/*globals $, tangelo, d3 */

var app = {};
app.lyra = null;
app.timeline = null;
app.data = null;
app.datasets = {};
app.range = null;
app.editor = null;

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

function launchLyra(qargs) {
    "use strict";

    var query = $.param(qargs || {});
    if (query.length > 0) {
        query = "?" + query;
    }

    app.lyra = window.open("/lyra/editor.html" + query, "_blank");
}

function createNew() {
    "use strict";

    launchLyra({
        editor: true,
        data: encodeURIComponent(JSON.stringify(app.data))
    });
}

function edit() {
    "use strict";

    launchLyra({
        editor: true,
        timeline: encodeURIComponent(JSON.stringify(app.timeline)),
        data: encodeURIComponent(JSON.stringify(app.data))
    });
}

function refresh(vega) {
    "use strict";

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

function shuffle() {
    "use strict";

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
    "use strict";

    app.vega.data[0].values = $.extend(true, [], app.data);
    refresh(app.vega);
}

function loadEditorData(editor, data) {
    "use strict";

    if (editor) {
        editor.setValue(JSON.stringify(data, null, "    "));
    }
}

function receiveMessage(e) {
    "use strict";

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

    d3.select("#edit-data")
        .on("click", function () {
            var el;

            d3.select("#edit-area")
                .selectAll("*")
                .remove();

            el = d3.select("#edit-area")
                .append("div")
                .attr("id", "ace-editor")
                .node();

            app.editor = ace.edit(el);
            app.editor.setTheme("ace/theme/twilight");
            app.editor.getSession().setMode("ace/mode/javascript");

            //app.editor.setValue(JSON.stringify(app.data, null, "    "));
            loadEditorData(app.editor, app.data);

            d3.select("#edit-area")
                .append("button")
                .classed("btn", true)
                .classed("btn-default", true)
                .text("Save")
                .on("click", function () {
                    var text = app.editor.getValue();

                    try {
                        app.data = JSON.parse(text);

                        if (app.vega) {
                            app.vega.data[0].values = app.data;
                            refresh(app.vega);
                        }

                        d3.select("#edit-area")
                            .selectAll("*")
                            .remove();
                    } catch (e) {
                        alert("Error!  Couldn't not parse data as JSON: " + e);
                    }
                });

            d3.select("#edit-area")
                .append("button")
                .classed("btn", true)
                .classed("btn-default", true)
                .text("Close")
                .on("click", function () {
                    d3.select("#edit-area")
                        .selectAll("*")
                        .remove();
                });
        });

    d3.select("#data-sources")
        .selectAll("li")
        .data(["Manual",
               "Fizzbin"])
        .enter()
        .append("li")
        .append("a")
        .classed("data-source", true)
        .attr("href", "#")
        .text(function (d) {
            return d;
        })
        .on("click", function (d) {
            d3.select("#data-source")
                .html(d + "<span class=\"caret\"></span>");

            app.data = app.datasets[d];
            loadEditorData(app.editor, app.data);
        });

    app.datasets = {
        Fizzbin: [
            {
                "foo": 1,
                "bar": "a"
            },
            {
                "foo": 3,
                "bar": "b"
            },
            {
                "foo": 2,
                "bar": "c"
            },
            {
                "foo": 5,
                "bar": "d"
            },
            {
                "foo": 4,
                "bar": "e"
            },
            {
                "foo": 7,
                "bar": "a"
            },
        ],

        Manual: null
    };

    $("a.data-source").get(0).click();
});
