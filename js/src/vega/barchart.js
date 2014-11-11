/*jslint browser: true */

(function (tangelo) {
    "use strict";

    tangelo.vegaspec.barchart = function (option) {
        var defSpec = {
            "width": option.width,
            "height": option.height,
            "padding": {
                "top": 10,
                "left": 30,
                "bottom": 30,
                "right": 10
            },
            "data": [{
                "name": "table"
            }],
            "scales": [{
                "name": "x",
                "type": "ordinal",
                "range": "width",
                "domain": {
                    "data": "table",
                    "field": "data.x"
                }
            }, {
                "name": "y",
                "range": "height",
                "nice": true,
                "domain": {
                    "data": "table",
                    "field": "data.y"
                }
            }],
            "axes": [{
                "type": "x",
                "scale": "x"
            }, {
                "type": "y",
                "scale": "y"
            }],
            "marks": [{
                "type": "rect",
                "from": {
                    "data": "table"
                },
                "properties": {
                    "enter": {
                        "x": {
                            "scale": "x",
                            "field": "data.x"
                        },
                        "width": {
                            "scale": "x",
                            "band": true,
                            "offset": -1
                        },
                        "y": {
                            "scale": "y",
                            "field": "data.y"
                        },
                        "y2": {
                            "scale": "y",
                            "value": 0
                        }
                    },
                    "update": {
                        "fill": {
                            "value": "steelblue"
                        }
                    },
                    "hover": {
                        "fill": {
                            "value": "red"
                        }
                    }
                }
            }]
        };

        var horizontalSpec = {
            "width": option.width,
            "height": option.height,
            "padding": {
                "top": 10,
                "left": 30,
                "bottom": 30,
                "right": 10
            },
            "data": [{
                "name": "table"
            }],
            "scales": [{
                "name": "y",
                "type": "ordinal",
                "range": "height",
                "domain": {
                    "data": "table",
                    "field": "data.x"
                }
            }, {
                "name": "x",
                "range": "width",
                "nice": true,
                "domain": {
                    "data": "table",
                    "field": "data.y"
                }
            }],
            "axes": [{
                "type": "x",
                "scale": "x"
            }, {
                "type": "y",
                "scale": "y"
            }],
            "marks": [{
                "type": "rect",
                "from": {
                    "data": "table"
                },
                "properties": {
                    "enter": {
                        "y": {
                            "scale": "y",
                            "field": "data.x"
                        },
                        "height": {
                            "scale": "y",
                            "band": true,
                            "offset": -1
                        },
                        "x": {
                            "scale": "x",
                            "field": "data.y"
                        },
                        "x2": {
                            "scale": "x",
                            "value": 0
                        }
                    },
                    "update": {
                        "fill": {
                            "value": "steelblue"
                        }
                    },
                    "hover": {
                        "fill": {
                            "value": "red"
                        }
                    }
                }
            }]
        };
        if (option && option.horizontal) {
            return horizontalSpec;
        }
        return defSpec;
    };
}(window.tangelo));
