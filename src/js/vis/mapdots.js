/*jslint browser: true, unparam: true */

(function (tangelo, google, d3, $) {
    "use strict";

    tangelo.vis.mapdots = function (spec) {
        var hoverContent = function (d) { return ""; },
            size = tangelo.accessor(spec.size, 1),
            color = tangelo.accessor(spec.color, ""),
            latitude = tangelo.accessor(spec.latitude, 0),
            longitude = tangelo.accessor(spec.longitude, 0),
            opacity = tangelo.accessor(spec.opacity, 1),
            on = {},
            el = spec.el,
            that = {},
            map,
            overlay,
            data = spec.data;

        map = new google.maps.Map(d3.select(el).node(), {
            zoom: 2,
            center: new google.maps.LatLng(0, 0),
            mapTypeId: google.maps.MapTypeId.TERRAIN
        });

        d3.select(el).classed("gmap", true)
            .style("width", "100%")
            .style("height", "100%");
        $(el).resize(function () { google.maps.event.trigger(map, "resize"); });

        overlay = new google.maps.OverlayView();

        // Add the container when the overlay is added to the map.
        overlay.onAdd = function() {
            var layer, colorScale, sizeScale;

            layer = d3.select(this.getPanes().overlayMouseTarget).append("div")
                .style("position", "absolute");
            //colorScale = d3.scale.linear().domain(d3.extent(data, function (item) { return item[color]; })).range(["white", "red"]);
            colorScale = d3.scale.category20();
            sizeScale = d3.scale.sqrt()
                .domain(d3.extent(data, size))
                .range([5, 15]);

            // Draw each marker as a separate SVG element.
            // We could use a single SVG, but what size would it have?
            overlay.draw = function() {
                var projection = this.getProjection(),
                    marker;

                function transform(d) {
                    var s = sizeScale(size(d));
                    d = new google.maps.LatLng(latitude(d), longitude(d));
                    d = projection.fromLatLngToDivPixel(d);
                    return d3.select(this)
                        .style("left", (d.x - s - 2) + "px")
                        .style("top", (d.y - s - 2) + "px")
                        .style("width", (2 * s + 4) + "px")
                        .style("height", (2 * s + 4) + "px");
                }

                marker = layer.selectAll("svg")
                    .data(data)
                    .each(transform) // update existing markers
                    .enter().append("svg:svg")
                    .each(transform)
                    .attr("class", "marker")
                    .style("cursor", "crosshair")
                    .style("position", "absolute")
                    .on("click", on.click);

                // Add a circle.
                marker.append("svg:circle")
                    .attr("r", function (d) { return sizeScale(size(d)); })
                    .attr("cx", function (d) { return sizeScale(size(d)) + 2; })
                    .attr("cy", function (d) { return sizeScale(size(d)) + 2; })
                    .style("fill", function (d) { return colorScale(color(d)); })
                    .style("opacity", function (d) { return opacity(d); })
                    .each(function (d) {
                        var cfg, content = hoverContent(d);
                        if (!content) {
                            return;
                        }
                        cfg = {
                            html: true,
                            container: "body",
                            placement: "top",
                            trigger: "hover",
                            content: hoverContent(d),
                            delay: {
                                show: 0,
                                hide: 0
                            }
                        };
                        $(this).popover(cfg);
                    });
            };
        };

        that.update = function(spec) {
            return that;
        };

        // Bind our overlay to the map…
        overlay.setMap(map);

        return that;
    };
}(window.tangelo, window.google, window.d3, window.$));