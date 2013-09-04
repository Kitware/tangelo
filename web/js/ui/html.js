/*jslint browser: true */

(function (tangelo, d3) {
    "use strict";

    tangelo.ui.html = function (spec) {
        var that = {};

        d3.select(spec.el).html(spec.content);

        function update() {
            return that;
        }

        that.update = update;

        return that;
    };

}(window.tangelo, window.d3));