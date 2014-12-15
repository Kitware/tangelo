(function (tangelo, $, _, vg) {
    "use strict";

    var parallelcoords = function (option) {
        var defSpec = {
            width: option.width || 0,
            height: option.height || 0,
            data: [
                {name: "table"},
                {
                    name: "fields",
                    values: option.fields
                }
            ],
            scales: [
                {
                    name: "ord",
                    type: "ordinal",
                    range: "width",
                    points: true,
                    domain: {
                        data: "fields",
                        field: "data"
                    }
                }
            ],
            axes: [],
            marks: [
                {
                    type: "group",
                    from: {data: "table"},
                    marks: [
                        {
                        type: "line",
                        from: {data: "fields"},
                        properties: {
                            enter: {
                                x: {
                                    scale: "ord",
                                    field: "data"
                                },
                                y: {
                                    scale: {field: "data"},
                                    group: "data",
                                    field: "data"
                                },
                                stroke: {value: "steelblue"},
                                strokeWidth: {value: 1},
                                strokeOpacity: {value: 0.3}
                            }
                        }
                        }
                    ]
                },
                {
                    type: "text",
                    from: {
                        data: "fields"
                    },
                    properties: {
                        enter: {
                            x: {
                                scale: "ord",
                                field: "data",
                                offset: -8
                            },
                            y: {
                                group: "height",
                                offset: 6
                            },
                            fontWeight: {value: "bold"},
                            fill: {value: "black"},
                            text: {field: "data"},
                            align: {value: "right"},
                            baseline: {value: "top"}
                        }
                    }
                }
            ]
        };

        /**
         * generating scales and axes based on field name
        */
        $.each(option.fields, function (i, v) {
            defSpec.scales.push({
                name: v,
                range: "height",
                zero: false,
                nice: true,
                domain: {
                    data: "table",
                    field: "data." + v
                }
            });
            defSpec.axes.push({
                type: "y",
                scale: v,
                offset: {
                    scale: "ord",
                    value: v
                }
            });
        });
        return defSpec;
    };

    $.widget("tangelo.parallelCoords", {
        options: {
            width: 0,
            height: 0,
            data: null,
            fields: null
        },

        _create: function () {
            var
                vegaspec = parallelcoords(this.options);
            vg.parse.spec(vegaspec, _.bind(function (chart) {
                this.vis = chart;
                this._update();
            }, this));
        },

        _update: function () {
            var chart;

            if (this.options.data && this.options.fields) {
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
            this.options.width = this.element.parent().width() - 50;
            this.options.height = this.element.parent().height() - 30;
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
}(window.tangelo, window.jQuery, window._, window.vg));
