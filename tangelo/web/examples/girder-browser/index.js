/*jslint browser: true */

/*globals $, tangelo, d3 */

$(function () {
    "use strict";

    $("#girder-browser").girderBrowser({
        label: "Girder",
        click: function (item, api) {
            console.log(item);
            window.location = [api, "item", item._id, "download"].join("/");
        }
    });
});
