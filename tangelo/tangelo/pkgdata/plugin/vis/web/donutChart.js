(function (tangelo, $, _, vg) {
    "use strict";

    var donutchart = function (option) {
        var outRadius = Math.min(option.width, option.height)/2,
            innerRadius = outRadius * option.inner / 100,
            textRadius = (outRadius + innerRadius) / 2,
            defSpec = {
                name: "donutchart",
                width: option.width,
                height: option.height,
                data: [{
                    name: "table",
                    transform: [{
                        type: "pie",
                        value: "data.value"
                    }]
                }],
                scales: [{
                    name: "r",
                    type: "sqrt",
                    domain: {
                        data: "table",
                        field: "data.value"
                    },
                    range: [20, 100]
                }, {
                    name: "label",
                    type: "ordinal",
                    domain: {
                        data: "table",
                        field: "data.label"
                    }
                }, {
                    name: "color",
                    type: "ordinal",
                    range: "category20"
                }],
                marks: [{
                    type: "arc",
                    from: {
                        data: "table"
                    },
                    properties: {
                        enter: {
                            x: {
                                group: "width",
                                mult: 0.5
                            },
                            y: {
                                group: "height",
                                mult: 0.5
                            },
                            startAngle: {
                                field: "startAngle"
                            },
                            endAngle: {
                                field: "endAngle"
                            },
                            innerRadius: {
                                value: innerRadius
                            },
                            outerRadius: {
                                value: outRadius
                            },
                            stroke: {
                                value: "#fff"
                            }
                        },
                        update: {
                            fill: {
                                scale: "color",
                                field: "data.value"
                            }
                        },
                        hover: {
                            fill: {
                                value: "pink"
                            }
                        }
                    }
                }, {
                    type: "text",
                    from: {
                        data: "table"
                    },
                    properties: {
                        enter: {
                            x: {
                                group: "width",
                                mult: 0.5
                            },
                            y: {
                                group: "height",
                                mult: 0.5
                            },
                            radius: {
                                value: textRadius,
                                offset: 0
                            },
                            theta: {
                                field: "midAngle"
                            },
                            fill: {
                                value: "#000"
                            },
                            align: {
                                value: "center"
                            },
                            baseline: {
                                value: "middle"
                            },
                            text: {
                                field: "data.label"
                            }
                        }
                    }
                }]
            };
        return defSpec;
    };

    $.widget("tangelo.donutChart", {
        options: {
            label: tangelo.accessor({value: 0}),
            value: tangelo.accessor({value: 0}),
            width: 0,
            height: 0,
            data: null
        },

        _create: function () {
            var vegaspec = donutchart(this.options);
            vg.parse.spec(vegaspec, _.bind(function (chart) {
                this.vis = chart;
                this._update();
            }, this));
        },

        _update: function () {
            var chart;

            if (this.options.data) {
                _.each(this.options.data, function (d) {
                    d.label = this.options.label(d);
                    d.value = this.options.value(d);
                }, this);
                if (this.vis) {
                    if (this.options.width === 0 && this.options.height === 0) {
                        this._setParentSize();
                    }
                    chart = this.vis({
                        el: this.element.get(0),
                        data: {
                            table: this.options.data
                        }
                    });

                    chart.width(this.options.width)
                        .height(this.options.height)
                        .update();
                }
            }
        },

        _setParentSize: function () {
            this.options.width = this.element.parent().width();
            this.options.height = this.element.parent().height();
        },

        resize: function (width, height, inner) {
            this.options.width = width;
            this.options.height = height;
            this.options.innner = inner;
            this._create(this.options);
        }

    });
}(window.tangelo, window.jQuery, window._, window.vg));
