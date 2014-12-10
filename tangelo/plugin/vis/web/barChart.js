(function (tangelo, $, vg) {
    "use strict";

    var barchart = function (option) {
        var defSpec = {
            width: option.width,
            height: option.height,
            padding: {
                top: 10,
                left: 30,
                bottom: 30,
                right: 10
            },
            data: [{
                name: "table"
            }],
            scales: [{
                name: "x",
                type: "ordinal",
                range: "width",
                domain: {
                    data: "table",
                    field: "data.x"
                }
            }, {
                name: "y",
                range: "height",
                nice: true,
                domain: {
                    data: "table",
                    field: "data.y"
                }
            }],
            axes: [{
                type: "x",
                scale: "x"
            }, {
                type: "y",
                scale: "y"
            }],
            marks: [{
                type: "rect",
                from: {
                    data: "table"
                },
                properties: {
                    enter: {
                        x: {
                            scale: "x",
                            field: "data.x"
                        },
                        width: {
                            scale: "x",
                            band: true,
                            offset: -1
                        },
                        y: {
                            scale: "y",
                            field: "data.y"
                        },
                        y2: {
                            scale: "y",
                            value: 0
                        }
                    },
                    update: {
                        fill: {
                            value: "steelblue"
                        }
                    },
                    hover: {
                        fill: {
                            value: "red"
                        }
                    }
                }
            }]
        },
            horizontalSpec = {
                width: option.width,
                height: option.height,
                padding: {
                    top: 10,
                    left: 30,
                    bottom: 30,
                    right: 10
                },
                data: [{
                    name: "table"
                }],
                scales: [{
                    name: "y",
                    type: "ordinal",
                    range: "height",
                    domain: {
                        data: "table",
                        field: "data.x"
                    }
                }, {
                    name: "x",
                    range: "width",
                    nice: true,
                    domain: {
                        data: "table",
                        field: "data.y"
                    }
                }],
                axes: [{
                    type: "x",
                    scale: "x"
                }, {
                    type: "y",
                    scale: "y"
                }],
                marks: [{
                    type: "rect",
                    from: {
                        data: "table"
                    },
                    properties: {
                        enter: {
                            y: {
                                scale: "y",
                                field: "data.x"
                            },
                            height: {
                                scale: "y",
                                band: true,
                                offset: -1
                            },
                            x: {
                                scale: "x",
                                field: "data.y"
                            },
                            x2: {
                                scale: "x",
                                value: 0
                            }
                        },
                        update: {
                            fill: {
                                value: "steelblue"
                            }
                        },
                        hover: {
                            fill: {
                                value: "red"
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

    $.widget("tangelo.barChart", {
        options: {
            label: tangelo.accessor({
                value: 0
            }),
            value: tangelo.accessor({
                value: 0
            }),
            width: 0,
            height: 0,
            data: null
        },

        _create: function () {
            var vegaspec = barchart(this.options);
            vg.parse.spec(vegaspec, _.bind(function (chart) {
                this.vis = chart;
                this.vegaspec = vegaspec;
                this._update();
            }, this));
        },

        _update: function () {
            var chart;

            if (this.options.data) {
                _.each(this.options.data, function (d) {
                    d.x = this.options.label(d);
                    d.y = this.options.value(d);
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

            // Add the padding.
            this.options.width -= this.vegaspec.padding.left + this.vegaspec.padding.right;
            this.options.height -= this.vegaspec.padding.top + this.vegaspec.padding.bottom;

            if (this.option.width <= 0) {
                this.option.width = 0;
            }

            if (this.option.height <= 0) {
                this.option.height = 0;
            }
        },

        resize: function (width, height) {
            this.options.width = width;
            this.options.height = height;
            this._update();
        }

    });
}(window.tangelo, window.jQuery, window.vg));
