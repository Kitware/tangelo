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

        var d = {
                "parentType": "folder",
                "parentId": this.folderId,
                "name": this.get("name"),
                "size": data.length
            };

        console.log(d);

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
                    success: function () {
                        if (end < data.length) {
                            uploadChunk(end, maxChunkSize);
                        }
                    }
                });
            }, this);

            uploadChunk(0, 64 * 1024 * 1024);
        }, this);

        Backbone.ajax({
            url: this.girderApi + "/file",
            type: "POST",
            data: d,
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
                method: "DELETE",
                success: _.bind(this._upload, this)
            });
        } else {
            this._upload();
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
    },

    loadData: function (file) {
        "use strict";

        this.model.set("_id", file.get("_id"));
        this.model.fetch({
            success: _.bind(function () {
                this.render();
            }, this)
        });
    },

    render: function () {
        "use strict";

        console.log(this.model);
    },

    getData: function () {
        "use strict";

        return this.model.get("data");
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
    },

    tagName: "li",

    events: {
        click: "selected"
    },

    render: function () {
        "use strict";

        d3.select(this.el)
            .append("a")
            .attr("href", "#")
            .html(this.model.get("name"));

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

        // When a visualization is selected, change the dropdown menu text.
        Backbone.on(this.selectedEvent, this.setSelected, this);
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
    },

    setSelected: function (f) {
        "use strict";

        this.selectedModel = f;

        var label = f.get("name");

        if (f.unsaved) {
            label = "<em>" + label + "</em>";
        }

        label += " <span class=\"caret\"></span>";

        this.$el.find("button")
            .html(label);
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
                var lyra = window.open("/lyra/editor.html?editor=true", "_blank");
                lyra.onload = function () {
                    lyra.postMessage(qargs, window.location.origin);
                };
            };

            f.createNew = function () {
                f.launchLyra({
                    new: true,
                    timeline: null,
                    data: encodeURIComponent(JSON.stringify(data.getData()))
                });
            };

            f.edit = function () {
                var model = vis.model;

                f.launchLyra({
                    new: false,
                    name: model.get("name"),
                    timeline: encodeURIComponent(JSON.stringify(model.get("timeline"))),
                    data: encodeURIComponent(JSON.stringify(model.get("lyra").vega.data[0].values))
                });
            };

            f.save = function () {
                vis.model.save();
            };

            f.receiveMessage = function (e) {
                var model,
                    name;

                if (e.data.new) {
                    name = "Unsaved " + _.uniqueId();

                    // Construct a new Vis model to represent the newly created
                    // Vega visualization.
                    model = new app.models.Vis({
                        girderApi: config.girderApi,
                        folderId: visFolderId,
                        name: name,
                        visName: name,
                        lyra: {
                            timeline: e.data.timeline,
                            vega: e.data.vega
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
                            vega: e.data.vega
                        }
                    });
                }
            };

            // The "New" button.
            d3.select("#create")
                .on("click", f.createNew);

            d3.select("#edit")
                .on("click", f.edit);

            d3.select("#save")
                .on("click", f.save);

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
                el: "#edit-area",
                girderApi: config.girderApi
            });
        };
    });
});
