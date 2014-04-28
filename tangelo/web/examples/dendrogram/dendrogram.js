/*jslint browser: true */
/*globals $ */

$(function () {
    "use strict";

    var data = {
        name: "Picard",
        children: [{
            name: "Riker",
            children: [
                {
                    name: "LaForge",
                    children: [
                        { name: "Crusher, W.", children: [] },
                        { name: "Gomez", children: [] },
                        { name: "Barclay", children: [] }
                    ]
                },

                {
                    name: "Worf",
                    children: [
                        { name: "Sito", children: [] },
                        { name: "Rhodes", children: [] },
                        { name: "D'Sora", children: [] }
                    ]
                },

                {
                    name: "Crusher, B.",
                    children: [
                        { name: "Ogawa", children: [] },
                        { name: "Selar", children: [] }
                    ]
                }
            ]
        }]
    };

    $("#content").dendrogram({
        data: data,
        id: {field: "name"},
        label: {field: "name"}
    });
    $(window).resize(function () {
        $("#content").dendrogram("resize");
    });
});
