/*jslint browser: true, nomen: true, unparam: true*/

(function (tangelo, $) {
    "use strict";

    if (!($ && $.widget)) {
        return;
    }

    tangelo.widget('tangelo.bokeh', {
        options: {
            url: null
        },

        _create: function () {
            var that = this;
            $.getJSON(this.options.url, function (obj) {
                that.element.html(obj.script + obj.div);
            });
        },
    });

}(window.tangelo, window.jQuery));
