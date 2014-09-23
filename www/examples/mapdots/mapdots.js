/*jslint browser: true */
/*globals $ */

$(function () {
    "use strict";

    var data = [
        {lat: 0,  lon: 0,   value: 5,  group: 'a'},
        {lat: 5,  lon: -5,  value: 6,  group: 'a'},
        {lat: 10, lon: -10, value: 7,  group: 'a'},
        {lat: 15, lon: -15, value: 8,  group: 'b'},
        {lat: 20, lon: -20, value: 9,  group: 'b'},
        {lat: 25, lon: -25, value: 10, group: 'b'},
        {lat: 30, lon: -30, value: 11, group: 'c'},
        {lat: 35, lon: -35, value: 12, group: 'c'},
        {lat: 40, lon: -40, value: 13, group: 'c'},
        {lat: 45, lon: -45, value: 14, group: 'd'},
        {lat: 50, lon: -50, value: 15, group: 'd'},
        {lat: 55, lon: -55, value: 16, group: 'd'},
        {lat: 60, lon: -60, value: 17, group: 'e'},
        {lat: 65, lon: -65, value: 18, group: 'e'},
        {lat: 70, lon: -70, value: 19, group: 'e'}
    ];

    $("#content").mapdots({
        data: data,
        latitude: {field: "lat"},
        longitude: {field: "lon"},
        size: {field: "value"},
        color: {field: "group"}
    });
});
