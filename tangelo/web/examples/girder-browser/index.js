/*jslint browser: true */

/*globals $, tangelo, d3 */

$(function () {
    "use strict";

    $("#girder-browser").girderBrowser({
        label: "Girder",
        search: true,
        click: function (item, api) {
            var div = d3.select("#file-info"),
                link;

            div.selectAll("*")
                .remove();

            div.append("p")
                .html("<b>Name:</b> " + item.name);

            div.append("p")
                .html("<b>Created:</b> " + item.created);

            div.append("p")
                .html("<b>Updated:</b> " + item.updated);

            div.append("p")
                .html("<b>Size:</b> " + item.size);

            link = [api, "item", item._id, "download"].join("/");
            div.append("p")
                .html("<a href=" + link + ">Download</a>");
        }
    });
});
