/*jslint browser: true */
/*globals Backbone, $, tangelo, vg, _, d3 */

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
        //this.itemId = options.itemId;
    },

    idAttribute: "_id",

    save: function () {
        "use strict";

        var url = this.girderApi + "/file",
            saveObj;

        if (this.isNew()) {
            saveObj = {
                name: this.get("filename"),
                visName: this.get("visName"),
                timeline: this.get("timeline"),
                vega: this.get("vega")
            };

            Backbone.ajax({
                url: url,
                type: "POST",
                dataType: "json",
                data: {
                    parentType: "folder",
                    parentId: this.folderId,
                    name: this.get("filename")
                },
                success: function (upload) {
                    this._upload(upload._id, JSON.stringify(saveObj));
                }
            });
        } else {
        }
    },

/*    fetch: function () {*/
    //},

/*    destroy: function () {*/
    //},

    _upload: function (data) {
        "use strict";

        console.log("saving: " + this.get("filename"));
    },

    url: function () {
        "use strict";

        return this.girderApi + "/item/" + this.get("_id") + "/download";
    }
});

// A model describing a file - either a visualization or data.
app.models.File = Backbone.Model.extend({});

// A collection describing all the Lyra vis files in a Girder instance.
app.collections.Folder = Backbone.Collection.extend({
    model: app.models.File,

    initialize: function (models, options) {
        "use strict";

        options = options || {};

        this.url = options.girderApi + "/item?folderId=" + options.folderId;
        this.fetch();
    }
});

// A view that renders a Vega visualization.
app.views.Vega = Backbone.View.extend({
    initialize: function (options) {
        "use strict";

        this.model = new app.models.Vis({
            girderApi: options.girderApi
        });
        Backbone.on("select:vis", this.loadVis, this);
    },

    loadVis: function (file) {
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

        var vega = this.model.get("vega");

        vg.parse.spec(vega, _.bind(function (chart) {
            chart({
                el: this.el,
                renderer: "svg"
            }).update();
        }, this));
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

        Backbone.trigger(this.selectedEvent, this.model);
    }
});

// A view that renders a list of files.
app.views.FileMenu = Backbone.View.extend({
    tagName: "div",

    initialize: function (options) {
        "use strict";

        var template;

        //this.options = options || {};
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

        var label = f.get("name");

        if (f.unsaved) {
            label = "<em>" + label + "</em>";
        }

        label += " <span class=\"caret\"></span>";

        this.$el.find("button")
            .html(label);
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
            var visfiles,
                visMenu,
                vis,
                datafiles,
                dataMenu,
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
                    data: encodeURIComponent(JSON.stringify(dataMenu.getSelectedData()))
                });
            };

            f.edit = function () {
                f.launchLyra({
                    new: false,
                    timeline: encodeURIComponent(JSON.stringify(visMenu.getSelectedVis().timeline)),
                    data: encodeURIComponent(JSON.stringify(dataMenu.getSelectedData()))
                });
            };

            f.receiveMessage = function (e) {
                var model,
                    newname;

                if (e.data.new) {
                    newname = "Unsaved " + _.uniqueId();

                    // Construct a new Vis model to represent the newly created
                    // Vega visualization.
                    model = new app.models.Vis({
                        name: newname,
                        visName: newname,
                        timeline: e.data.timeline,
                        vega: e.data.vega
                    });

                    visfiles.add(model);
                } else {
                    console.log("incoming message");
                    console.log(e.data);
                }
            };

            // The "New" button.
            d3.select("#create")
                .on("click", f.createNew);

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
        };
    });
});
