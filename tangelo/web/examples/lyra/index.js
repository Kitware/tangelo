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

function errorReport(selector, message) {
    $(selector).empty();
    d3.select(selector)
        .html(message);
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

function save() {
    "use strict";

    var filename,
        unsaved,
        continuation;

    // Get the name of the file to save (stripping off the space that lies
    // between the filename and the caret symbol in the file selector HTML).
    filename = d3.select("#vis-file")
        .text()
        .slice(0, -1);

    // Define a continuation to invoke immediately, or when the "save" button in
    // the filename dialog is clicked.
    continuation = function () {
        console.log(filename);
        $("#save-dialog").modal("toggle");
    };

    // If the filename is "Unsaved *", we will need to prompt the user for a
    // real filename.
    unsaved = filename.lastIndexOf("Unsaved") === 0;
    if (unsaved) {
        d3.select("#save-button")
            .on("click", function () {
                filename = d3.select("#save-filename")
                    .property("value")
                    .trim();

                if (filename === "" || filename.toLowerCase().lastIndexOf("unsaved") === 0) {
                    d3.select("#save-alert")
                        .classed("alert", true)
                        .classed("alert-danger", true)
                        .html("<strong>Error!</strong> Bad filename: '" + filename + "'");
                } else {
                    continuation();
                }
            });

        $("#save-dialog").modal("toggle");
    } else {
        continuation();
    }
}

function refresh(vega) {
    "use strict";

    $("#vega").empty();

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
            .html("<em>" + app.vis.visName + "</em> <span class=\"caret\"></span>");

        app.new = false;
    }

    refresh(app.vis.vega);

    d3.select("#save")
        .attr("disabled", null);

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

        d3.select("#save")
            .on("click", save);

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

                            if (app.vis.vega) {
                                app.vis.vega.data[0].values = app.data;
                                refresh(app.vis.vega);
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
            var isUnsaved = d.visName.lastIndexOf("Unsaved") === 0,
                bookends = ["", ""],
                response;

            if (isUnsaved) {
                bookends[0] = "<em>";
                bookends[1] = "</em>";
            }

            d3.select("#vis-file")
                .html(bookends[0] + d.visName + bookends[1] + " <span class=\"caret\"></span>");

            if (isUnsaved) {
                app.vis = app.unsaved[d.visName];
                refresh(app.vis.vega);
            } else {
                $.ajax({
                    url: config.girderApi + "/item/" + d._id + "/download",
                    dataType: "text",
                    success: function (fileContents) {
                        var spec;

                        // Attempt to parse JSON from the file contents.
                        try {
                            spec = JSON.parse(fileContents);
                        } catch (e) {
                            errorReport("#vega", "<b>Error parsing Vega spec in file '" + d.visName + "': " + e.message + "</b>");
                            return;
                        }

                        // Check for non-object JSON files.
                        if (!tangelo.isObject(spec)) {
                            errorReport("#vega", "<b>Error in Vega spec in file '" + d.visName + "': spec is not a JSON object</b>");
                            return;
                        }

                        // If all looks good, try to render.
                        //app.
                    },
                    error: function (jqxhr, status, err) {
                        errorReport("#vega", "<b>Error reading file '" + d.visName + "': " + err + "</b>")
                    }
                });
            }
        };

        getUrls(config.girderApi, config.collection, config.visFolder, function (files) {
            var unsaved,
                visChoices;

            unsaved = Object.keys(app.unsaved).map(function (x) {
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

            // If there are some files in the list, select the first one.
            visChoices = $("a.vis-file");
            if (visChoices.length > 0) {
                visChoices.get(0).click();
            }
        });
    });
});
