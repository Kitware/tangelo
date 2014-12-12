(function (tangelo) {
    "use strict";

    var mapping = tangelo.getPlugin("mapping");

    mapping.geovis = function (worldGeometryFile) {
        var spec = {
            width: 800,
            height: 800,
            data: [
                {
                    name: "countries",
                    url: null,
                    format: {type: "topojson", feature: "countries"}
                },
                {
                    name: "links",
                    transform: [
                        {
                            type: "copy",
                            from: "data",
                            fields: ["source", "target"]
                        }
                    ]
                },
                {
                    name: "filter"
                },
                {
                    name: "table",
                    transform: [
                        {
                            type: "force",
                            links: "links",
                            iterations: 0
                        },
                        {
                            type: "geo",
                            lat: "data.latitude",
                            lon: "data.longitude",
                            projection: "azimuthalEqualArea",
                            clipAngle: 179.99,
                            scale: 200,
                            translate: [400, 400],
                            precision: 0.1
                        }
                    ]
                }
            ],
            scales: [
                {
                    name: "color",
                    type: "ordinal",
                    range: "category10"
                },
                {
                    name: "size",
                    type: "linear",
                    range: [100, 400],
                    zero: false,
                    domain: {data: "table", field: "data.size"}
                }
            ],
            legends: [
                {
                    fill: "color",
                    orient: "left",
                    properties: {
                        labels: {
                            fontSize: {value: 18}
                        },
                        symbols: {
                            size: {value: 100},
                            stroke: {value: "#fff"}
                        }
                    }
                }
            ],
            marks: [
                {
                    type: "path",
                    from: {
                        data: "countries",
                        transform: [
                            {
                                type: "geopath",
                                value: "data",
                                projection: "azimuthalEqualArea",
                                clipAngle: 179.99,
                                scale: 200,
                                translate: [400, 400],
                                precision: 0.1
                            }
                        ]
                    },
                    properties: {
                        enter: {
                            stroke: {value: "#fff"},
                            path: {field: "path"}
                        },
                        update: {
                            fill: {value: "#ccc"}
                        }
                    }
                },
                {
                    type: "path",
                    from: {
                        data: "links",
                        transform: [
                            {type: "link", shape: "curve"}
                        ]
                    },
                    properties: {
                        update: {
                            path: {field: "path"},
                            stroke: {value: "black"},
                            strokeOpacity: {value: 1},
                            strokeWidth: {value: 1}
                        }
                    }
                },
                {
                    type: "symbol",
                    from: {
                        data: "table"
                    },
                    properties: {
                        enter: {
                            x: {field: "x"},
                            y: {field: "y"}
                        },
                        update: {
                            stroke: {value: "#fff"},
                            fill: {
                                scale: "color",
                                field: "data.color"
                            },
                            size: {
                                scale: "size",
                                field: "data.size"
                            }
                        }
                    }
                }
            ]
        };

        spec.data[0].url = worldGeometryFile;
        return spec;
    };
}(window.tangelo));
