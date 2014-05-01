/*jslint browser: true, unparam: true*/
/*global $, tangelo, d3, geo*/
$(function () {
    "use strict";

    var map = $("#content").geojsMap(),
        data = [
            [ "NEW YORK", "NY", "40.757929", "-73.985506"],
            [ "LOS ANGELES", "CA", "34.052187", "-118.243425"],
            [ "DENVER", "CO", "39.755092", "-104.988123"],
            [ "PORTLAND", "OR", "45.523104", "-122.670132"],
            [ "HONOLULU", "HI", "21.291982", "-157.821856"],
            [ "ANCHORAGE", "AK", "61.216583", "-149.899597"],
            [ "DALLAS", "TX", "32.781078", "-96.797111"],
            [ "SALT LAKE CITY", "UT", "40.771592", "-111.888189"],
            [ "MIAMI", "FL", "25.774252", "-80.190262"],
            [ "PHOENIX", "AZ", "33.448263", "-112.073821"],
            [ "CHICAGO", "IL", "41.879535", "-87.624333"],
            [ "WASHINGTON", "DC", "38.892091", "-77.024055"],
            [ "SEATTLE", "WA", "47.620716", "-122.347533"],
            [ "NEW ORLEANS", "LA", "30.042487", "-90.025126"],
            [ "SAN FRANCISCO", "CA", "37.775196", "-122.419204"],
            [ "ATLANTA", "GA", "33.754487", "-84.389663"]
        ],
        svg = map.geojsMap("svg"),
        points = d3.select(svg).selectAll(".points").data(data);

    points.enter()
        .append("circle")
        .attr("class", "points")
        .attr("r", 5)
        .style("fill", "steelblue");

    function draw() {
        var pts = [];
        data.forEach(function (d) {
            var pt = map.geojsMap("latlng2display", geo.latlng(parseFloat(d[2]), parseFloat(d[3])));
            pts.push(pt[0]);
        });
        points
            .attr("cx", function (d, i) { return pts[i].x; })
            .attr("cy", function (d, i) { return pts[i].y; });
    }
    draw();
    map.on("draw", draw);
});
