/*jslint browser: true */

(function (tangelo) {
    "use strict";

    tangelo.vegaspec.parallelcoords = function (option) {
        var defSpec = {
            "width": option.width || 0,
            "height": option.height || 0,
            "data": [{
                "name": "table"
            }, {
                "name": "fields",
                "values": option.fields
            }],
            "scales": [{
                "name": "ord",
                "type": "ordinal",
                "range": "width",
                "points": true,
                "domain": {
                    "data": "fields",
                    "field": "data"
                }
            }],
            "axes": [],
            "marks": [{
                "type": "group",
                "from": {
                    "data": "table"
                },
                "marks": [{
                    "type": "line",
                    "from": {
                        "data": "fields"
                    },
                    "properties": {
                        "enter": {
                            "x": {
                                "scale": "ord",
                                "field": "data"
                            },
                            "y": {
                                "scale": {
                                    "field": "data"
                                },
                                "group": "data",
                                "field": "data"
                            },
                            "stroke": {
                                "value": "steelblue"
                            },
                            "strokeWidth": {
                                "value": 1
                            },
                            "strokeOpacity": {
                                "value": 0.3
                            }
                        }
                    }
                }]
            }, {
                "type": "text",
                "from": {
                    "data": "fields"
                },
                "properties": {
                    "enter": {
                        "x": {
                            "scale": "ord",
                            "field": "data",
                            "offset": -8
                        },
                        "y": {
                            "group": "height",
                            "offset": 6
                        },
                        "fontWeight": {
                            "value": "bold"
                        },
                        "fill": {
                            "value": "black"
                        },
                        "text": {
                            "field": "data"
                        },
                        "align": {
                            "value": "right"
                        },
                        "baseline": {
                            "value": "top"
                        }
                    }
                }
            }]
        };
        
        /**
         * generating scales and axes based on field name
        */
        $.each(option.fields, function (i, v){
            defSpec.scales.push({
                "name": v,
                "range": "height",
                "zero": false,
                "nice": true,
                "domain": {
                    "data": "table",
                    "field": "data." + v
                }
            });
            defSpec.axes.push({
                "type": "y",
                "scale": v,
                "offset": {
                    "scale": "ord",
                    "value": v
                }
            });
        });
        return defSpec;
    };
}(window.tangelo));
