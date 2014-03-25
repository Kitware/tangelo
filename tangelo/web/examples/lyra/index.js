/*jslint browser: true */
/*globals $, tangelo, d3 */

var app = {};
app.vis = {
    name: null,
    vega: null,
    timeline: null
};
app.lyra = null;
app.data = null;
app.filelist = [];
app.editor = null;
app.unsaved = {};
app.unsavedIdx = 1;
app.new = false;

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

    app.new = true;
    launchLyra({
        editor: true,
        data: encodeURIComponent(JSON.stringify(app.data))
    });
}

function edit() {
    "use strict";

    launchLyra({
        editor: true,
        timeline: encodeURIComponent(JSON.stringify(app.vis.timeline)),
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

    app.vis.timeline = e.data.timeline;
    app.vis.vega = e.data.vega;
    app.data = $.extend(true, [], e.data.vega.data[0].values);

    if (app.new) {
        app.vis.name = app.vis.visName = "Unsaved " + app.unsavedIdx;

        app.unsaved[app.vis.name] = $.extend(true, {}, app.vis);

        app.filelist.push($.extend(true, {}, app.vis));

        app.unsavedIdx += 1;

        d3.select("#vis-files")
            .selectAll("li")
            .data(app.filelist, function (d) {
                return d.visName;
            })
            .enter()
            .append("li")
            .append("a")
            .classed("vis-file", true)
            .attr("href", "#")
            .text(app.vis.visName)
            .on("click", app.clickVis);

        d3.select("#vis-file")
            .html(app.vis.visName + " <span class=\"caret\"></span>");

        app.new = false;
    }

    refresh(app.vis.vega);
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

                    $.getJSON(config.girderApi + "/item/" + d._id + "/download", function (data) {
                        app.data = data;
                        loadEditorData(app.editor, app.data);
                    });
                });
            $("a.data-source").get(0) && $("a.data-source").get(0).click();
        });

        app.clickVis = function (d) {
            d3.select("#vis-file")
                .html(d.visName + " <span class=\"caret\"></span>");

            if (d.visName.lastIndexOf("Unsaved") === 0) {
                app.vis = app.unsaved[d.visName];
            } else {
                $.getJSON(config.girderApi + "/item/" + d._id + "/download", function (data) {
                    console.log(data);
                });
            }

            refresh(app.vis.vega);
        };

        getUrls(config.girderApi, config.collection, config.visFolder, function (files) {
            var unsaved = Object.keys(app.unsaved).map(function (x) {
                return app.unsaved[x];
            });

            app.filelist = files.concat(unsaved);

            $.each(app.filelist, function (i, v) {
                v.visName = v.name.split(".")[0];
            });

            d3.select("#vis-files")
                .selectAll("li")
                .data(app.filelist, function (d) {
                    return d.visName;
                })
                .enter()
                .append("li")
                .append("a")
                .classed("vis-file", true)
                .attr("href", "#")
                .text(function (d) {
                    return d.visName;
                })
                .on("click", app.clickVis);

            $("a.vis-file").get(0) && ("a.vis-file").get(0).click();
        });
    });
});
