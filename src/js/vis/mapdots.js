/*jslint browser: true, unparam: true */

(function (tangelo, google, d3, $) {
    "use strict";

    $.widget("tangelo.mapdots", {
        options: {
            hoverContent: null,
            size: null,
            color: null,
            latitude: null,
            longitude: null,
            opacity: null,
            data: null
        },

        _missing: {
            hoverContent: "",
            size: 1,
            color: "",
            latitude: 0,
            longitude: 0,
            opacity: 1
        },

        _create: function () {
            var el = this.element.get(0),
                that = this,
                overlay,
                options;

            this.map = new google.maps.Map(el, {
                zoom: 2,
                center: new google.maps.LatLng(0, 0),
                mapTypeId: google.maps.MapTypeId.TERRAIN
            });

            d3.select(el)
                //.classed("gmap", true)
                .style("width", "100%")
                .style("height", "100%");

            $(el).resize(function () {
                google.maps.event.trigger(that.map, "resize");
            });

            this.overlay = new google.maps.OverlayView();

            // Add the container when the overlay is added to the map.
            this.overlay.onAdd = function () {
                var layer, colorScale, sizeScale;

                layer = d3.select(this.getPanes().overlayMouseTarget).append("div")
                    .style("position", "absolute");
                //colorScale = d3.scale.linear().domain(d3.extent(data, function (item) { return item[color]; })).range(["white", "red"]);
                colorScale = d3.scale.category20();
                sizeScale = d3.scale.sqrt()
                    .domain(d3.extent(that.options.data, that.options.size))
                    .range([5, 15]);

                // Draw each marker as a separate SVG element.
                // We could use a single SVG, but what size would it have?
                this.draw = function () {
                    var projection = this.getProjection(),
                        marker,
                        on = {},
                        transform;

                    transform = function (d) {
                        var s = sizeScale(that.options.size(d));
                        d = new google.maps.LatLng(that.options.latitude(d), that.options.longitude(d));
                        d = projection.fromLatLngToDivPixel(d);
                        return d3.select(this)
                            .style("left", (d.x - s - 2) + "px")
                            .style("top", (d.y - s - 2) + "px")
                            .style("width", (2 * s + 4) + "px")
                            .style("height", (2 * s + 4) + "px");
                    };

                    marker = layer.selectAll("svg")
                        .data(that.options.data)
                        .each(transform) // update existing markers
                        .enter().append("svg:svg")
                        .each(transform)
                        .attr("class", "marker")
                        .style("cursor", "crosshair")
                        .style("position", "absolute")
                        .on("click", on.click);

                    // Add a circle.
                    marker.append("svg:circle")
                        .attr("r", function (d) { return sizeScale(that.options.size(d)); })
                        .attr("cx", function (d) { return sizeScale(that.options.size(d)) + 2; })
                        .attr("cy", function (d) { return sizeScale(that.options.size(d)) + 2; })
                        .style("fill", function (d) { return colorScale(that.options.color(d)); })
                        .style("opacity", function (d) { return that.options.opacity(d); })
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
                };

                this.onRemove = function () {};
            };

            options = $.extend(true, {}, this.options);
            delete options.disabled;
            delete options.create;
            this._setOptions(options);

            this.overlay.setMap(this.map);
        },

        _setOption: function (key, value) {
            if (key !== "data") {
                this._super(key, tangelo.accessor(value, this._missing[key]));
            } else {
                this._super(key, value);
            }
        },

        _setOptions: function (options) {
            var that = this;

            $.each(options, function (key, value) {
                that._setOption(key, value);
            });

            this._update();
        },

        _update: function () {
            // Bind our overlay to the map…
            console.log("_update");
        }
    });
}(window.tangelo, window.google, window.d3, window.jQuery));
