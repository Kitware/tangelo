/*jslint browser: true */

/*globals $, google, d3, circularHeatChart */

function GMap(elem, options) {
    "use strict";

    var that = this;

    this.floodingPoly = [
        new google.maps.LatLng(42.65441, -73.7363),
        new google.maps.LatLng(42.64738, -73.7409),
        new google.maps.LatLng(42.64302, -73.7410),
        new google.maps.LatLng(42.64176, -73.7422),
        new google.maps.LatLng(42.63929, -73.7446),
        new google.maps.LatLng(42.63715, -73.7442),
        new google.maps.LatLng(42.63443, -73.7441),
        new google.maps.LatLng(42.63304, -73.7460),
        new google.maps.LatLng(42.62900, -73.7465),
        new google.maps.LatLng(42.63061, -73.7595),
        new google.maps.LatLng(42.63617, -73.7565),
        new google.maps.LatLng(42.64188, -73.7501),
        new google.maps.LatLng(42.64715, -73.7476),
        new google.maps.LatLng(42.65179, -73.7468),
        new google.maps.LatLng(42.65438, -73.7437)
    ];

    this.droughtPoly = [
        new google.maps.LatLng(42.64428, -73.7318),
        new google.maps.LatLng(42.64671, -73.7181),
        new google.maps.LatLng(42.62225, -73.7223),
        new google.maps.LatLng(42.63806, -73.7371),
        new google.maps.LatLng(42.64428, -73.7318)
    ];

    function jitterify(path, delta) {
        var i,
            newLat,
            newLng,
            result = [];
        for (i = 0; i < path.length; i = i + 1) {
            result.push(path[i]);
            if (i + 1 < path.length) {
                newLat = (path[i].lat() + path[i + 1].lat()) / 2 + delta * (Math.random() - 0.5);
                newLng = (path[i].lng() + path[i + 1].lng()) / 2 + delta * (Math.random() - 0.5);
                result.push(new google.maps.LatLng(newLat, newLng));
            }
        }
        return result;
    }

    function expand(path, center, factor) {
        var i,
            newLat,
            newLng,
            result = [];
        for (i = 0; i < path.length; i = i + 1) {
            newLat = factor * (path[i].lat() - center.lat()) + center.lat() + 0.0005 * (Math.random() - 0.5);
            newLng = factor * (path[i].lng() - center.lng()) + center.lng() + 0.0005 * (Math.random() - 0.5);
            result.push(new google.maps.LatLng(newLat, newLng));
        }
        return result;
    }

    this.floodingPoly1 = jitterify(jitterify(this.floodingPoly, 0.0005), 0.00025);
    this.floodingPoly2 = expand(this.floodingPoly1, new google.maps.LatLng(42.63708, -73.7507), 1.1);
    this.floodingPoly3 = expand(this.floodingPoly1, new google.maps.LatLng(42.63708, -73.7507), 1.25);
    this.droughtPoly1 = jitterify(jitterify(jitterify(this.droughtPoly, 0.0005), 0.00025), 0.00015);
    this.droughtPoly1 = expand(this.droughtPoly1, new google.maps.LatLng(42.63743, -73.7287), 0.5);
    this.droughtPoly2 = expand(this.droughtPoly1, new google.maps.LatLng(42.63743, -73.7287), 1.75);
    this.droughtPoly3 = expand(this.droughtPoly1, new google.maps.LatLng(42.63743, -73.7287), 3);

    // Create the map object and place it into the specified container element.
    this.map = new google.maps.Map(elem, options);

    this.colors = d3.scale.category10();

    d3.range(10).forEach(function (i) { that.colors(i); });

    function makePoly(points, color) {
        var poly = new google.maps.Polygon({
            paths: points,
            strokeColor: color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: color,
            fillOpacity: 0.35
        });
        poly.setMap(that.map);
    }

    makePoly(this.floodingPoly1, this.colors(0));
    makePoly(this.floodingPoly2, this.colors(0));
    makePoly(this.floodingPoly3, this.colors(0));

    makePoly(this.droughtPoly1, this.colors(3));
    makePoly(this.droughtPoly2, this.colors(1));
    makePoly(this.droughtPoly3, this.colors(8));
}

function createTimePlot() {
    "use strict";

    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        parent = d3.select("#chart1"),
        width = parent.node().offsetWidth - margin.left - margin.right,
        height = parent.node().offsetHeight - margin.top - margin.bottom,
        x,
        y,
        xAxis,
        yAxis,
        line,
        main,
        svg,
        trend;

    x = d3.time.scale()
        .range([0, width]);

    y = d3.scale.linear()
        .range([height, 0]);

    trend = [{x: 1993, y: -7}, {x: 2030, y: -7 + (3.2 * (2030 - 1993))}];

    xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(d3.format("d"))
        .tickSize(height);

    yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickSize(width);

    line = d3.svg.line()
        .x(function (d) { return x(d.x); })
        .y(function (d) { return y(d.y); });

    d3.select("#chart1 *").remove();
    main = parent.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
    svg = main.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Sea level data source:
    // http://sealevel.colorado.edu/content/2013rel1-global-mean-sea-level-time-series-seasonal-signals-removed
    d3.csv("sealevel.csv", function (data) {
        var xElem,
            yElem,
            lineElem,
            trendElem;

        data.forEach(function (d) {
            d.x = +d.year;
            d.y = +d.mm;
        });

        x.domain(d3.extent(data.concat(trend), function (d) { return d.x; }));
        y.domain(d3.extent(data.concat(trend), function (d) { return d.y; }));

        xElem = svg.append("g")
            .attr("class", "x axis")
            .call(xAxis);

        yElem = svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + width + ",0)")
            .call(yAxis);

        lineElem = svg.selectAll("circle")
            .data(data)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("r", 3)
            .attr("cx", function (d) { return x(d.x); })
            .attr("cy", function (d) { return y(d.y); });

        trendElem = svg.append("path")
            .datum(trend)
            .attr("class", "line")
            .attr("d", line);

        $(window).resize(function () {
            width = parent.node().offsetWidth - margin.left - margin.right;
            main.attr("width", width + margin.left + margin.right);
            x.range([0, width]);
            xElem.call(xAxis);
            yAxis.tickSize(width);
            yElem
                .attr("transform", "translate(" + width + ",0)")
                .call(yAxis);
            lineElem.attr("cx", function (d) { return x(d.x); });
            trendElem.attr("d", line);
        });
    });
}

function createCircularChart() {
    "use strict";
    var i,
        chart,
        data,
        radial = d3.range(1990, 2050, 10),
        segment = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    data = [];
    for (i = 0; i < radial.length * segment.length; i = i + 1) {
        data[i] = Math.random() + i / 20;
    }

    chart = circularHeatChart()
        .innerRadius(20)
        .numSegments(segment.length)
        .segmentHeight(14)
        .range(["yellow", "red"])
        .radialLabels(radial)
        .segmentLabels(segment);

    d3.select('#chart2')
        .selectAll('svg')
        .data([data])
        .enter()
        .append('svg')
        .call(chart);
}

window.onload = function () {
    "use strict";
    var options,
        div,
        map;

    options = {
        zoom: 15,
        center: new google.maps.LatLng(42.64302, -73.7474),
        mapTypeId: google.maps.MapTypeId.TERRAIN
    };
    div = d3.select("#map").node();
    map = new GMap(div, options);
    createTimePlot();
    createCircularChart();
};
