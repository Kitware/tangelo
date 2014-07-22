/*jslint browser: true */
/*globals Backbone, $, tangelo, vg, _, d3 */

var visfiles;

var app = {};

// Tables of Backbone objects.
app.models = {};
app.collections = {};
app.views = {};

// A model describing a file that contains a Lyra-edited visualization.
app.models.Vis = Backbone.Model.extend({
    initialize: function (options) {
        "use strict";

        options = options || {};
        this.girderApi = options.girderApi;
        this.folderId = options.folderId;
    },

    idAttribute: "_id",

    _upload: function () {
        "use strict";

        var data = JSON.stringify(this.get("lyra")),
            uploadChunks;

        uploadChunks = _.bind(function (upload) {
            var uploadChunk = _.bind(function (start, maxChunkSize) {
                var end,
                    blob,
                    form;

                end = Math.min(start + maxChunkSize, data.length);

                blob = new window.Blob([data.slice(start, end)]);

                form = new window.FormData();
                form.append("offset", start);
                form.append("uploadId", upload._id);
                form.append("chunk", blob);

                Backbone.ajax({
                    url: this.girderApi + "/file/chunk",
                    type: "POST",
                    data: form,
                    contentType: false,
                    processData: false,
                    success: _.bind(function (upload) {
                        if (end < data.length) {
                            uploadChunk(end, maxChunkSize);
                        } else {
                            this.set("_id", upload.itemId);
                            if (this.get("newName")) {
                                this.set("name", this.get("newName"));
                                this.unset("newName");
                            }
                        }
                    }, this)
                });
            }, this);

            uploadChunk(0, 64 * 1024 * 1024);
        }, this);

        Backbone.ajax({
            url: this.girderApi + "/file",
            type: "POST",
            data: {
                "parentType": "folder",
                "parentId": this.folderId,
                "name": this.get("name"),
                "size": data.length
            },
            success: uploadChunks
        });
    },

    save: function () {
        "use strict";

        if (!this.isNew()) {
            // Delete the file from the server, before reuploading the current
            // spec.
            Backbone.ajax({
                url: this.girderApi + "/item/" + this.id,
                type: "DELETE",
                success: _.bind(this._upload, this)
            });
        } else {
            $("#save-dialog").modal("show");
        }
    },

    fetch: function (options) {
        "use strict";

        var url = this.girderApi + "/item/" + this.id + "/download",
            success = options.success || $.noop,
            error = options.error || $.noop;

        Backbone.ajax({
            url: url,
            dataType: "json",
            success: _.bind(function (lyra) {
                this.set("lyra", lyra);
                success(this, lyra, options);
            }, this),
            error: _.bind(function (jqxhr) {
                error(this, jqxhr, options);
            }, this)
        });
    },

    sync: function (method, model, options) {
        if (method === "delete") {
            options.url = this.girderApi + "/item/" + this.id;
            return Backbone.sync.call(model, method, model, options);
        }
    },
});

app.models.Data = Backbone.Model.extend({
    initialize: function (options) {
        "use strict";

        options = options || {};
        this.girderApi = options.girderApi;
    },

    idAttribute: "_id",

    url: function () {
        "use strict";

        return this.girderApi + "/item/" + this.get("_id") + "/download";
    },

    parse: function (response) {
        "use strict";

        return {
            data: response
        };
    }
});

// A collection describing all the Lyra vis files in a Girder instance.
app.collections.Folder = Backbone.Collection.extend({
    model: app.models.Vis,

    initialize: function (models, options) {
        "use strict";

        options = options || {};
        this.folderId = options.folderId;

        this.url = options.girderApi + "/item?folderId=" + options.folderId;
        this.fetch({
            success: function (models) {
                models.forEach(function (m) {
                    m.girderApi = options.girderApi;
                });
            }
        });
    }
});

// A view that renders a Vega visualization.
app.views.Vega = Backbone.View.extend({
    initialize: function (options) {
        "use strict";

        options = options || {};
        this.girderApi = options.girderApi;

        Backbone.on("select:vis", this.loadVis, this);
    },

    loadVis: function (file) {
        "use strict";

        var render = _.bind(function () {
            this.render();
        }, this);

        this.model = file;

        this.model.on("destroy", this.clear, this);

        if (file.get("lyra")) {
            render();
        } else {
            file.fetch({
                success: render
            });
        }
    },

    render: function () {
        "use strict";

        vg.parse.spec(this.model.get("lyra").vega, _.bind(function (chart) {
            chart({
                el: this.el,
                renderer: "svg"
            }).update();
        }, this));
    },

    clear: function () {
        "use strict";

        this.$el.empty();
    }
});

// A view to "render" a dataset (using a read-only ACE editor instance).
app.views.Data = Backbone.View.extend({
    initialize: function (options) {
        "use strict";

        this.model = new app.models.Data({
            girderApi: options.girderApi
        });

        Backbone.on("select:data", this.loadData, this);

        this.div = d3.select(this.el)
            .append("div")
            .attr("id", "ace-editor")
            .node();

        this.ace = ace.edit(this.div);
        this.ace.setTheme("ace/theme/twilight");
        this.ace.getSession().setMode("ace/mode/javascript");
        this.ace.setReadOnly(true);
     },

    loadData: function (file) {
        "use strict";

        this.model.set("_id", file.get("_id"));
        this.model.fetch({
            success: _.bind(this.render, this)
        });
    },

    render: function () {
        "use strict";

        this.ace.setValue(JSON.stringify(this.model.get("data"), null, "    "));
    },

    getData: function () {
        "use strict";

        return this.model.get("data");
    },

    show: function () {
        d3.select(this.div)
            .style("display", null);
    },

    hide: function () {
        d3.select(this.div)
            .style("display", "none");
    }
});

// A collection describing all the data files in a Girder instance.
app.collections.Data = Backbone.Collection.extend({
});

// A view that renders a single file as a list item.
app.views.File = Backbone.View.extend({
    initialize: function (options) {
        "use strict";

        this.selectedEvent = options.selectedEvent;

        this.model.on("change:name", this.render, this);
    },

    tagName: "li",

    events: {
        click: "selected"
    },

    render: function () {
        "use strict";

        var me = d3.select(this.el),
            bookends = ["", ""];

        me.selectAll("*")
            .remove();

        if (this.model.isNew()) {
            bookends[0] = "<em>";
            bookends[1] = "</em>";
        }

        me.append("a")
            .attr("href", "#")
            .html(bookends[0] + this.model.get("name") + bookends[1]);

        return this;
    },

    selected: function () {
        "use strict";

        if (this.selectedEvent) {
            Backbone.trigger(this.selectedEvent, this.model);
        }
    }
});

// A view that renders a list of files.
app.views.FileMenu = Backbone.View.extend({
    tagName: "div",

    initialize: function (options) {
        "use strict";

        var template;

        options = options || {};
        this.selectedEvent = options.selectedEvent;

        template = _.template($("#vis-files-view-template").html(), {});
        this.$el.html(template);

        // When the collection gains an item, add it to the dropdown menu.
        this.collection.on("add", this.addItem, this);

        // When the collection loses an item, remove it from the dropdown menu.
        this.collection.on("remove", this.removeItem, this);

        // When a visualization is selected, change the dropdown menu text.
        Backbone.on(this.selectedEvent, this.setSelected, this);

        // A table of individual file views.
        this.views = {};
    },

    addItem: function (file) {
        "use strict";

        var newitem = new app.views.File({
            className: "file",
            model: file,
            selectedEvent: this.selectedEvent
        });

        this.$el.find("ul")
            .append(newitem.render().el);

        this.views[file.get("name")] = newitem;
    },

    removeItem: function (file) {
        var name = file.get("name");

        this.views[name].$el.remove();
        delete this.views[name];

        this.selectedModel = null;
        this.setLabel();
    },

    setLabel: function () {
        var name = this.selectedModel && this.selectedModel.get("name") || "Select a File",
            isNew = this.selectedModel && this.selectedModel.isNew() || true;

        if (isNew) {
            name = "<em>" + name + "</em>";
        }

        name += " <span class=\"caret\"></span>";

        this.$el.find("button")
            .html(name);
    },

    setSelected: function (f) {
        "use strict";

        if (this.selectedModel) {
            this.selectedModel.off("change:name", this.setLabel, this);
        }
        this.selectedModel = f;
        this.selectedModel.on("change:name", this.setLabel, this);

        this.setLabel();
    },

    getSelected: function () {
        "use strict";

        return this.selectedModel;
    }
});

$(function () {
    "use strict";

    tangelo.config("config.json", function (config) {
        var main;

        // Issue ajax calls to get the Lyra collection in girder, and then both
        // the visualization and data folders therein.
        $.ajax({
            url: config.girderApi + "/collection",
            type: "GET",
            dataType: "json",
            data: {
                text: config.collection
            },
            success: function (lyraCollection) {
                // Now find the visualizations folder.
                $.ajax({
                    url: config.girderApi + "/folder",
                    type: "GET",
                    dataType: "json",
                    data: {
                        parentType: "collection",
                        parentId: lyraCollection._id,
                        text: config.visFolder
                    },
                    success: function (visFolder) {
                        // Make sure there is a result.
                        if (visFolder.length === 0) {
                            console.warn("No folder '" + config.visFolder + "' found in collection '" + config.collection + "'");
                        }

                        // Find the data folder.
                        $.ajax({
                            url: config.girderApi + "/folder",
                            type: "GET",
                            dataType: "json",
                            data: {
                                parentType: "collection",
                                parentId: lyraCollection._id,
                                text: config.dataFolder
                            },
                            success: function (dataFolder) {
                                // Make sure there is a result.
                                if (dataFolder.length === 0) {
                                    console.warn("No folder '" + config.dataFolder + "' found in collection '" + config.collection + "'");
                                }

                                // Run the actual application.
                                main(config, visFolder[0]._id, dataFolder[0]._id);
                            }
                        });
                    }
                });
            }

        });

        // The main application.
        main = function (config, visFolderId, dataFolderId) {
            var //visfiles,
                visMenu,
                vis,
                datafiles,
                dataMenu,
                data,
                f;

            f = {};

            // A function that launches a Lyra editor window.
            f.launchLyra = function (qargs) {
                var lyra = window.open("/lyra/index.html", "_blank");
                lyra.isNew = qargs.new;
                lyra.onload = function () {
                    lyra.postMessage(qargs, window.location.origin);
                };
            };

            f.new = function () {
                if (!data.getData()) {
                    $("#no-data-dialog").modal("show");
                    return;
                }

                f.launchLyra({
                    new: true,
                    timeline: null,
                    data: {
                        name: "data",
                        values: data.getData()
                    }
                });
            };

            f.edit = function () {
                var model = vis.model;

                f.launchLyra({
                    new: false,
                    name: model.get("name"),
                    timeline: model.get("lyra").timeline,
                    data: {
                        name: "data",
                        values: model.get("lyra").vega.data[0].values
                    }
                });
            };

            f.save = function () {
                vis.model.save();
            };

            f.delete = function () {
                vis.model.destroy();
            };

            f.receiveMessage = function (e) {
                var model,
                    name;

                if (e.source.isNew) {
                    name = "Unsaved " + _.uniqueId();

                    // Construct a new Vis model to represent the newly created
                    // Vega visualization.
                    model = new app.models.Vis({
                        girderApi: config.girderApi,
                        folderId: visFolderId,
                        name: name,
                        lyra: {
                            timeline: e.data.timeline,
                            vega: e.data.spec
                        }
                    });

                    // Add the model to the vis files list, and simulate its
                    // selection (so that the menu will show it as active, and
                    // it will be rendered to the Vega view).
                    visfiles.add(model);
                    Backbone.trigger("select:vis", model);
                } else {
                    vis.model.set({
                        lyra: {
                            timeline: e.data.timeline,
                            vega: e.data.spec
                        }
                    });
                    vis.render();
                }
            };

            // The "New" button.
            d3.select("#create")
                .on("click", f.new);

            d3.select("#edit")
                .on("click", f.edit);

            d3.select("#save")
                .on("click", f.save);

            // The delete button.
            d3.select("#delete")
                .on("click", f.delete);

            // The show/hide data button.
            d3.select("#show-data")
                .on("click", function () {
                    var me = d3.select(this),
                        text = me.text();

                    if (text === "Show") {
                        data.show();
                        me.text("Hide");
                    } else {
                        data.hide();
                        me.text("Show");
                    }
                });

            // Set up to receive messages.
            window.addEventListener("message", f.receiveMessage, false);

            // A collection of visualization files residing on Girder, and a
            // dropdown menu to select them.
            visfiles = new app.collections.Folder([], {
                girderApi: config.girderApi,
                folderId: visFolderId
            });

            visMenu = new app.views.FileMenu({
                el: "#vis-files-view",
                collection: visfiles,
                selectedEvent: "select:vis"
            });

            // The same, but for the data files.
            datafiles = new app.collections.Folder([], {
                girderApi: config.girderApi,
                folderId: dataFolderId
            });

            dataMenu = new app.views.FileMenu({
                el: "#data-files-view",
                collection: datafiles,
                selectedEvent: "select:data"
            });

            // A Vega view.
            vis = new app.views.Vega({
                el: "#vega",
                girderApi: config.girderApi
            });

            // A data view.
            data = new app.views.Data({
                el: "#ace",
                girderApi: config.girderApi
            });

            // The modal dialog
            d3.select("#save-button")
                .on("click", function () {
                    var filename = d3.select("#save-filename")
                        .property("value")
                        .trim();

                    if (filename === "" || filename.toLowerCase().lastIndexOf("unsaved") === 0) {
                        d3.select("#save-alert")
                            .classed("alert", true)
                            .classed("alert-danger", true)
                            .html("<strong>Error!</strong> Bad filename: '" + filename + "'");
                    } else {
                        vis.model.set("newName", filename);
                        $("#save-dialog").modal("hide");
                        vis.model._upload();
                    }
                });

            $("#save-dialog").on("hidden.bs.modal", function () {
                d3.select("#save-filename")
                    .property("value", "");

                d3.select("#save-alert")
                    .classed("alert", false)
                    .classed("alert-danger", false)
                    .html("");
            });
        };
    });
});
