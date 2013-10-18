/*jslint browser: true */

(function (tangelo, d3, $) {
    "use strict";

    tangelo.ui.split = function () {
        var vertical;

        vertical = false;

        function my(selection) {
            selection.each(function () {
                var main = d3.select(this).classed("pane", false);
                main.append("div").classed("p1", true);//.classed("pane", true);
                main.append("div").classed("p2", true);//.classed("pane", true);
                $(main.node()).splitter({
                    type: vertical ? "v" : "h",
                    outline: true,
                    resizeToWidth: true
                });
            });
        }

        my.vertical = function(value) {
            if (!arguments.length) {
                return vertical;
            }
            vertical = value;
            return my;
        };

        return my;
    };

}(window.tangelo, window.d3, window.$));