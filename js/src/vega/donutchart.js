/*jslint browser: true */

(function (tangelo) {
    "use strict";

    tangelo.vegaspec.donutchart = function (option) {
        var outRadius = Math.min(option.width, option.height)/2,
            innerRadius = outRadius * option.inner / 100,
            textRadius = (outRadius + innerRadius) / 2;
        var vegaTest = {
            "name": "arc",
            "width": 400,
            "height": 400,
            "data": [{
                "name": "table",
                "values": [12, 23, 47, 6, 52, 19],
                "transform": [{
                    "type": "pie",
                    "value": "data"
                }]
            }],
            "scales": [{
                "name": "r",
                "type": "sqrt",
                "domain": {
                    "data": "table",
                    "field": "data"
                },
                "range": [20, 100]
            }, {
                "name": "color",
                "type": "ordinal",
                "range": "category10"
            }],
            "marks": [{
                "type": "arc",
                "from": {
                    "data": "table"
                },
                "properties": {
                    "enter": {
                        "x": {
                            "group": "width",
                            "mult": 0.5
                        },
                        "y": {
                            "group": "height",
                            "mult": 0.5
                        },
                        "startAngle": {
                            "field": "startAngle"
                        },
                        "endAngle": {
                            "field": "endAngle"
                        },
                        "innerRadius": {
                            "value": 20
                        },
                        "outerRadius": {
                            "scale": "r"
                        },
                        "stroke": {
                            "value": "#fff"
                        }
                    },
                    "update": {
                        "fill": {
                            "scale": "color"
                        }
                    },
                    "hover": {
                        "fill": {
                            "value": "pink"
                        }
                    }
                }
            }, {
                "type": "text",
                "from": {
                    "data": "table"
                },
                "properties": {
                    "enter": {
                        "x": {
                            "group": "width",
                            "mult": 0.5
                        },
                        "y": {
                            "group": "height",
                            "mult": 0.5
                        },
                        "radius": {
                            "scale": "r",
                            "offset": 8
                        },
                        "theta": {
                            "field": "midAngle"
                        },
                        "fill": {
                            "value": "#000"
                        },
                        "align": {
                            "value": "center"
                        },
                        "baseline": {
                            "value": "middle"
                        },
                        "text": {
                            "field": "data"
                        }
                    }
                }
            }]
        };

        var defSpec = {
            "name": "donutchart",
            "width": option.width,
            "height": option.height,
            "data": [{
                "name": "table",
                "transform": [{
                    "type": "pie",
                    "value": "data.value"
                }]
            }],
            "scales": [{
                "name": "r",
                "type": "sqrt",
                "domain": {
                    "data": "table",
                    "field": "data.value"
                },
                "range": [20, 100]
            }, {
                "name": "label",
                "type": "ordinal",
                "domain": {
                    "data": "table",
                    "field": "data.label"
                },
            }, {
                "name": "color",
                "type": "ordinal",
                "range": "category20"
            }],
            "marks": [{
                "type": "arc",
                "from": {
                    "data": "table"
                },
                "properties": {
                    "enter": {
                        "x": {
                            "group": "width",
                            "mult": 0.5
                        },
                        "y": {
                            "group": "height",
                            "mult": 0.5
                        },
                        "startAngle": {
                            "field": "startAngle"
                        },
                        "endAngle": {
                            "field": "endAngle"
                        },
                        "innerRadius": {
                            "value": innerRadius
                        },
                        "outerRadius": {
                            "value": outRadius
                        },
                        "stroke": {
                            "value": "#fff"
                        }
                    },
                    "update": {
                        "fill": {
                            "scale": "color",
                            "field": "data.value"
                        }
                    },
                    "hover": {
                        "fill": {
                            "value": "pink"
                        }
                    }
                }
            }, {
                "type": "text",
                "from": {
                    "data": "table"
                },
                "properties": {
                    "enter": {
                        "x": {
                            "group": "width",
                            "mult": 0.5
                        },
                        "y": {
                            "group": "height",
                            "mult": 0.5
                        },
                        "radius": {
                            "value": textRadius,
                            "offset": 0
                        },
                        "theta": {
                            "field": "midAngle"
                        },
                        "fill": {
                            "value": "#000"
                        },
                        "align": {
                            "value": "center"
                        },
                        "baseline": {
                            "value": "middle"
                        },
                        "text": {
                            "field": "data.label"
                        }
                    }
                }
            }]
        };
        return defSpec;
    };
}(window.tangelo));
