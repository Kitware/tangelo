/*jslint browser: true */
/*globals $, tangelo, d3 */

var app = {};
app.config = null;
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
    "use strict";

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

function girderUpload(girderApi, data, filename, folderId, callback) {
    "use strict";

    // Start the upload.
    $.ajax({
        url: girderApi + "/file",
        type: "POST",
        data: {
            "parentType": "folder",
            "parentId": folderId,
            "name": filename,
            "size": data.length
        },
        success: function (upload) {
            var uploadChunk = function (uploadId, start, maxChunkSize) {
                var end,
                    blob,
                    form;

                end = Math.min(start + maxChunkSize, data.length);

                blob = new window.Blob([data.slice(start, end)]);

                form = new window.FormData();
                form.append("offset", start);
                form.append("uploadId", upload._id);
                form.append("chunk", blob);

                $.ajax({
                    url: girderApi + "/file/chunk",
                    type: "POST",
                    data: form,
                    contentType: false,
                    processData: false,
                    success: function () {
                        if (end < data.length) {
                            uploadChunk(uploadId, end, maxChunkSize);
                        } else {
                            if (callback) {
                                callback();
                            } else {
                                console.log("file successfully uploaded");
                            }
                        }
                    }
                });

            };

            uploadChunk(upload._id, 0, 64 * 1024 * 1024);
        }
    });
}

function saveVis(filename, timeline, vega, girderApi, folderId) {
    "use strict";

    var saveObj = {
        name: filename,
        visName: filename,
        timeline: timeline,
        vega: vega
    },
        saveText = JSON.stringify(saveObj, null, "    ");

    girderUpload(girderApi, saveText, filename, folderId, function () {
        getFiles(girderApi, app.config.visFolderId, function (files) {
            var unsaved,
                selection;

            unsaved = Object.keys(app.unsaved).map(function (x) {
                return app.unsaved[x];
            });

            app.filelist = files.concat(unsaved);

            $.each(app.filelist, function (i, v) {
                v.visName = v.name.split(".")[0];
            });

            selection = d3.select("#vis-files")
                .selectAll("li")
                .data(app.filelist, function (d) {
                    return d.visName;
                });

            selection.enter()
                .append("li")
                .append("a")
                .classed("vis-file", true)
                .attr("href", "#")
                .text(function (d) {
                    return d.visName;
                })
                .on("click", app.clickVis);

            selection.exit()
                .remove();
        });
    });
}

function save() {
    "use strict";

    var filename,
        oldFilename,
        unsaved;

    // Get the name of the file to save (stripping off the space that lies
    // between the filename and the caret symbol in the file selector HTML).
    filename = d3.select("#vis-file")
        .text()
        .slice(0, -1);

    // If the filename is "Unsaved *", we will need to prompt the user for a
    // real filename.
    unsaved = filename.lastIndexOf("Unsaved") === 0;
    if (unsaved) {
        oldFilename = filename;
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
                    delete app.unsaved[oldFilename];
                    d3.select("#vis-file")
                        .html(filename + " <span class=\"caret\"></span>");
                    saveVis(filename, app.vis.timeline, app.vis.vega, app.config.girderApi, app.config.visFolderId);
                }

                $("#save-dialog").modal("hide");
            });

        $("#save-dialog").modal("show");
    } else {
        saveVis(filename, app.vis.timeline, app.vis.vega, app.config.girderApi, app.config.visFolderId);
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

function getFiles(girderApi, folderId, callback) {
    "use strict";

    var data = {
        folderId: folderId
    };

    $.getJSON(girderApi + "/item", data, function (files) {
        callback(files);
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
        var getFolderId;

        window.addEventListener("message", receiveMessage, false);

        app.config = config;

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

        getFolderId = function (girderApi, collection, folder, callback) {
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

                    callback(folder[0]._id);
                });
            });
        };

        getFolderId(config.girderApi, config.collection, config.dataFolder, function (dataFolderId) {
            config.dataFolderId = dataFolderId;

            getFolderId(config.girderApi, config.collection, config.visFolder, function (visFolderId) {
                config.visFolderId = visFolderId;

                getFiles(config.girderApi, config.dataFolderId, function (files) {
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
                                var spec,
                                    missing;

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

                                // Check for required fields in the JSON object.
                                missing = [];
                                $.each(["name", "visName", "timeline", "vega"], function (i, v) {
                                    if (!spec.hasOwnProperty(v)) {
                                        missing.push(v);
                                    }
                                });

                                if (missing.length > 0) {
                                    errorReport("#vega", "<b>Error in Vega spec in file '" + d.visName + "': spec is missing these fields: " + missing.join(", "));
                                    return;
                                }

                                // If all looks good, try to render.
                                app.vis = spec;
                                refresh(app.vis.vega);
                            },
                            error: function (jqxhr, status, err) {
                                errorReport("#vega", "<b>Error reading file '" + d.visName + "': " + err + "</b>");
                            }
                        });
                    }
                };

                getFiles(config.girderApi, config.visFolderId, function (files) {
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
    });
});
