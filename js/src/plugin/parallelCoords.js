/*jslint browser: true, unparam: true, nomen: true */

(function (tangelo, $, vg) {
    "use strict";

    if (!($ && $.widget && vg)) {
        return;
    }

    tangelo.widget("tangelo.parallelCoords", {
        options: {
            width: 0,
            height: 0,
            data: null,
            fields: null
        },

        _create: function () {
            this.options = $.extend(true, {}, this._defaults, this.options);
            var that = this,
                vegaspec = tangelo.vegaspec.parallelcoords(that.options);
            vg.parse.spec(vegaspec, function (chart) {
                that.vis = chart;
                that._update();
            });
        },

        _update: function () {
            var that = this;
            if (this.options.data && this.options.fields) {
                if (this.vis) {
                    if (this.options.width === 0 && this.options.height === 0) {
                        this._setParentSize();
                    }
                    this.vis({
                        el: that.element.get(0),
                        data: {
                            table: that.options.data,
                        }
                    }).width(this.options.width).height(this.options.height).update();
                }
            }
        },

        _setParentSize: function () {
            var that = this;
            this.options.width = that.element.parent().width() - 50;
            this.options.height = that.element.parent().height() - 30;
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
