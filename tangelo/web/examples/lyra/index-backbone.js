/*jslint browser: true */
/*globals Backbone, $, tangelo */

var app = {};

// Tables of Backbone objects.
app.models = {};
app.collections = {};
app.views = {};

// A model describing a file that contains a Lyra-edited visualization.
app.models.Vis = Backbone.Model.extend({
});

// A collection describing all the Lyra vis files in a Girder instance.
app.collections.Vis = Backbone.Collection.extend({
    model: app.models.Vis,

    initialize: function (models, options) {
        "use strict";

        options = options || {};

        this.url = options.girderApi + "/item?folderId=" + options.folderId;
        this.fetch();
    }
});

// A view that renders a Vega visualization.
app.views.Vega = Backbone.View.extend({
});

// A model describing a file - either a visualization or data.
app.models.File = Backbone.Model.extend({
});

// A collection describing all the data files in a Girder instance.
app.collections.Data = Backbone.Collection.extend({
});

// A view that renders a single file as a list item.
app.views.File = Backbone.View.extend({
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

        //this.$el.trigger("select:file", this.model);
        Backbone.trigger("select:vis", this.model);
    }
});

// A view that renders a list of files.
app.views.FileMenu = Backbone.View.extend({
    tagName: "div",

    initialize: function (options) {
        "use strict";

        var template;

        this.options = options || {};

        template = _.template($("#vis-files-view-template").html(), {});
        this.$el.html(template);

        // When the collection gains an item, add it to the dropdown menu.
        this.collection.on("add", this.addItem, this);

        // When a visualization is selected, change the dropdown menu text.
        Backbone.on("select:vis", this.setSelected, this);
    },

    addItem: function (file) {
        "use strict";

        var newitem = new app.views.File({
            className: "file",
            model: file
        });

        this.$el.find("ul")
            .append(newitem.render().el);
    },

    setSelected: function (f) {
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
                visMenu;

            // A collection of visualization files residing on Girder.
            visfiles = new app.collections.Vis([], {
                girderApi: config.girderApi,
                folderId: visFolderId
            });

            // A dropdown menu allowing the user to select a visualization.
            visMenu = new app.views.FileMenu({
                el: "#vis-files-view",
                collection: visfiles
            });
        };

    });
});
