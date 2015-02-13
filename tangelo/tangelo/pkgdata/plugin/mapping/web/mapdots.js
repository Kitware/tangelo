(function (tangelo, google, d3, $) {
    "use strict";

    $.widget("tangelo.mapdots", {
        options: {
            hoverContent: tangelo.accessor({value: ""}),
            size: tangelo.accessor({value: 1}),
            color: tangelo.accessor({value: ""}),
            latitude: tangelo.accessor({value: 0}),
            longitude: tangelo.accessor({value: 0}),
            opacity: tangelo.accessor({value: 1}),
            data: null
        },

        _create: function () {
            var el = this.element.get(0),
                that = this;

            this.map = new google.maps.Map(el, {
                zoom: 2,
                center: new google.maps.LatLng(0, 0),
                mapTypeId: google.maps.MapTypeId.TERRAIN
            });

            d3.select(el)
                .style("width", "100%")
                .style("height", "100%");

            $(el).resize(function () {
                google.maps.event.trigger(that.map, "resize");
            });

            this.overlay = new google.maps.OverlayView();

            // Add the container when the overlay is added to the map.
            this.overlay.onAdd = function () {
                that.layer = d3.select(this.getPanes().overlayMouseTarget)
                    .append("div")
                    .style("position", "absolute");
                that.colorScale = d3.scale.category10();

                that._update();

                // Draw each marker as a separate SVG element.  We could use a
                // single SVG, but what size would it have?
                this.draw = function () {
                    var marker,
                        ptransform;

                    if (!that.transform) {
                        return;
                    }

                    ptransform = that.transform(this.getProjection());

                    marker = that.layer.selectAll("svg")
                        .data(that.options.data)
                        .each(ptransform); // update existing markers

                    marker.enter()
                        .append("svg")
                        .each(ptransform)
                        .attr("class", "marker")
                        .style("cursor", "crosshair")
                        .style("position", "absolute")
                        .append("circle");

                    d3.selectAll("svg > circle")
                        .data(that.options.data)
                        .attr("r", function (d) {
                            return that.sizeScale(that.options.size(d));
                        })
                        .attr("cx", function (d) {
                            return that.sizeScale(that.options.size(d)) + 2;
                        })
                        .attr("cy", function (d) {
                            return that.sizeScale(that.options.size(d)) + 2;
                        })
                        .style("fill", function (d) {
                            return that.colorScale(that.options.color(d));
                        })
                        .style("opacity", function (d) {
                            return that.options.opacity(d);
                        })
                        .each(function (d) {
                            var cfg, content = that.options.hoverContent(d);
                            if (!content) {
                                return;
                            }
                            cfg = {
                                html: true,
                                container: "body",
                                placement: "top",
                                trigger: "hover",
                                content: that.options.hoverContent(d),
                                delay: {
                                    show: 0,
                                    hide: 0
                                }
                            };
                            $(this).popover(cfg);
                        });

                    marker.exit()
                        .remove();
                };

                this.onRemove = $.noop;
            };

            this.overlay.setMap(this.map);
        },

        _update: function () {
            var that = this;

            this.sizeScale = d3.scale.sqrt()
                .domain(d3.extent(this.options.data, this.options.size))
                .range([5, 15]);

            this.transform = function (projection) {
                return function (d) {
                    var s = that.sizeScale(that.options.size(d));
                    d = new google.maps.LatLng(that.options.latitude(d), that.options.longitude(d));
                    d = projection.fromLatLngToDivPixel(d);
                    return d3.select(this)
                        .style("left", (d.x - s - 2) + "px")
                        .style("top", (d.y - s - 2) + "px")
                        .style("width", (2 * s + 4) + "px")
                        .style("height", (2 * s + 4) + "px");
                };
            };

            // Redraw the map.
            if (this.overlay.draw) {
                this.overlay.draw();
            }
        }
    });
}(window.tangelo, window.google, window.d3, window.jQuery));
