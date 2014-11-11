/*jslint browser: true, unparam: true, nomen: true */

(function (tangelo, $, vg) {
    "use strict";

    if (!($ && $.widget && vg)) {
        return;
    }

    tangelo.widget("tangelo.barChart", {
        options: {
            label: tangelo.accessor({
                value: 0
            }),
            value: tangelo.accessor({
                value: 0
            }),
            data: null
        },

        _create: function () {
            this.options = $.extend(true, {}, this._defaults, this.options);
            var that = this,
                vegaspec = tangelo.vegaspec.barchart(that.options);
            vg.parse.spec(vegaspec, function (chart) {
                that.vis = chart;
                that.vegaspec = vegaspec;
                that._update();
            });
        },

        _update: function () {
            var that = this;

            if (this.options.data) {
                this.options.data.forEach(function (d) {
                    d.x = that.options.label(d);
                    d.y = that.options.value(d);
                });
                if (this.vis) {
                    if (this.options.width === 0 && this.options.height === 0) {
                        this._setParentSize();
                    }
                    this.vis({
                        el: that.element.get(0),
                        data: {
                            table: that.options.data
                        }
                    }).width(this.options.width).height(this.options.height).update();
                }
            }
        },

        _setParentSize: function () {
            var that = this;
            this.options.width = that.element.parent().width();
            this.options.height = that.element.parent().height();
            /// add the padding
            this.options.width -= that.vegaspec.padding.left + this.vegaspec.padding.right;
            this.options.height -= that.vegaspec.padding.top + this.vegaspec.padding.bottom;
            console.log("set parent size " + this.options.width + ", " + this.options.height);
        },

        resize: function (width, height) {
            console.log("resize to " + width + ", " + height);
            this.options.width = width;
            this.options.height = height;
            this._update();
        }

    });
}(window.tangelo, window.jQuery, window.vg));
