/*jslint browser: true */
/*globals $ */

$(function () {
    "use strict";

    var data = {
        nodes: [
            {lat:  0, lon:  0, value: 10, group: 'a', name: 'node 1'},
            {lat: 10, lon: 10, value: 20, group: 'a', name: 'node 2'},
            {lat: 20, lon: 20, value: 30, group: 'b', name: 'node 3'},
            {lat: 30, lon: 30, value: 40, group: 'b', name: 'node 4'},
            {lat: 40, lon: 20, value: 50, group: 'c', name: 'node 5'},
            {lat: 50, lon: 10, value: 60, group: 'c', name: 'node 6'},
            {lat: 60, lon:  0, value: 70, group: 'd', name: 'node 7'}
        ],
        links: [
            {s: 0, t: 1},
            {s: 1, t: 2},
            {s: 2, t: 3},
            {s: 3, t: 4},
            {s: 4, t: 5},
            {s: 5, t: 6},
            {s: 6, t: 0}
        ]
    };

    $("#content").geonodelink({
        data: data,
        worldGeometry: "../data/world-110m.json",
        linkSource: {field: "s"},
        linkTarget: {field: "t"},
        nodeLatitude: {field: "lat"},
        nodeLongitude: {field: "lon"},
        nodeSize: {field: "value"},
        nodeColor: {field: "group"}
    });
});
