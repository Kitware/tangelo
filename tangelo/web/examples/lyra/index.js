/*jslint browser: true */
/*globals $, tangelo, d3 */

var app = {};
app.lyra = null;
app.timeline = null;
app.data = null;
app.editor = null;

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
    });
}

function loadEditorData(editor, data) {
    "use strict";

    if (editor) {
        editor.setValue(JSON.stringify(data, null, "    "));
    }
}

function getUrls(girderApi, collection, folder, callback) {
    "use strict";

    var data = {
        text: collection
    };

    $.getJSON(girderApi + "/collection", data, function (lyra) {
        data = {
            parentType: "collection",
            parentId: lyra._id,
            text: folder
        };

        $.getJSON(girderApi + "/folder", data, function (folder) {
            if (folder.length === 0) {
                console.warn("error: no girder path /lyra/" + folder + " found!");
                return;
            }

            if (folder.length > 1) {
                console.warn("error: more than one path /lyra/" + folder + " found!");
                return;
            }

            data = {
                folderId: folder[0]._id
            };

            $.getJSON(girderApi + "/item", data, function (files) {
                callback(files);
            });

        });
    });
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

    tangelo.config("config.json", function (config) {
        window.addEventListener("message", receiveMessage, false);

        d3.select("#create")
            .on("click", createNew);

        d3.select("#edit")
            .on("click", edit);

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

        getUrls(config.girderApi, config.collection, config.dataFolder, function (files) {
            d3.select("#data-sources")
                .selectAll("li")
                .data(files)
                .enter()
                .append("li")
                .append("a")
                .classed("data-source", true)
                .attr("href", "#")
                .text(function (d) {
                    d.dataName = d.name.split(".")[0];
                    return d.dataName;
                })
                .on("click", function (d) {
                    d3.select("#data-source")
                        .html(d.dataName + " <span class=\"caret\"></span>");

                    $.getJSON(config.girderApi + "/item/" + d._id + "/download", function (data)  {
                        app.data = data;
                        loadEditorData(app.editor, app.data);
                    });
                });
            $("a.data-source").get(0).click();
        });
    });
});
