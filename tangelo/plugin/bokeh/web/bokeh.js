(function (tangelo, $) {
    "use strict";

    $.widget("tangelo.bokeh", {
        options: {
            url: null
        },

        // jscs: disable disallowDanglingUnderscores
        _create: function () {
        // jscs: enable disallowDanglingUnderscores
            var that = this;
            $.getJSON(this.options.url, function (obj) {
                that.element.html(obj.script + obj.div);
            });
        }
    });
}(window.tangelo, window.jQuery));
