/*jshint jquery: true */

$(function () {
    "use strict";

    var data = [
            ["New York", "NY", 40.757929, -73.985506],
            ["Los Angeles", "CA", 34.052187, -118.243425],
            ["Denver", "CO", 39.755092, -104.988123],
            ["Portland", "OR", 45.523104, -122.670132],
            ["Honolulu", "HI", 21.291982, -157.821856],
            ["Anchorage", "AK", 61.216583, -149.899597],
            ["Dallas", "TX", 32.781078, -96.797111],
            ["Salt Lake City", "UT", 40.771592, -111.888189],
            ["Miami", "FL", 25.774252, -80.190262],
            ["Phoenix", "AZ", 33.448263, -112.073821],
            ["Chicago", "IL", 41.879535, -87.624333],
            ["Washington", "DC", 38.892091, -77.024055],
            ["Seattle", "WA", 47.620716, -122.347533],
            ["New Orleans", "LA", 30.042487, -90.025126],
            ["San Francisco", "CA", 37.775196, -122.419204],
            ["Atlanta", "GA", 33.754487, -84.389663]
        ];

    $("#content").geojsMap({
        tileUrl: "http://otile1.mqcdn.com/tiles/1.0.0/map/<zoom>/<x>/<y>.png",
        center: {
            x: -(98 + 35/60),
            y: 39 + 50/60
        },
        zoom: 0,
        data: data,
        layers: [{
            renderer: "d3",
            features: [{
                type: "point",
                position: function (d) {
                    return {
                        x: d[3],
                        y: d[2]
                    };
                },
                radius: 10,
                fillColor: function (d) {
                    return d[1];
                },
                fillOpacity: 1.0,
                stroke: false
            }]
        }]
    });
});
