/*jslint browser: true, nomen: true, todo: true */

(function (tangelo, $) {
    "use strict";

    var unavailable = tangelo.unavailable({
        plugin: "tangelo.widget",
        required: ["JQuery", "JQuery UI"]
    });

    if (!$) {
        tangelo.widget = unavailable;
    } else if (!$.widget) {
        tangelo.widget = $.fn.widget = unavailable;
    } else {
        $.widget("tangelo.widget", {
            _setOption: function (key, value) {
                if (this._defaults[key] && this._defaults[key].accessor) {
                    this._super(key, tangelo.accessor(value));
                } else {
                    this._super(key, value);
                }
            },

            _setOptions: function (options) {
                var that = this;

                $.each(options, function (key, value) {
                    that._setOption(key, value);
                });

                this._update();
            },

            // This function intentionally does nothing.  It is here as a
            // placeholder to avoid an error in case a child widget does not
            // supply an _update() method for some reason.
            _update: $.noop
        });

        tangelo.widget = function (name, spec) {
            var key,
                ptype = {
                    _defaults: spec.options || {},

                    _create: function () {
                        this.options = $.extend({}, this._defaults, this.options);

                        if (spec._create) {
                            spec._create.apply(this, arguments);
                        }

                        // TODO: reduce _defaults down to a map to bool, then rename it
                        // to _accessor.

                        this._setOptions(this.options);
                    }
                };

            for (key in spec) {
                if (spec.hasOwnProperty(key)) {
                    if (key === "_defaults") {
                        tangelo.fatalError("tangelo.widget(\"" + name + "\")", "You cannot use '_defaults' as a field name in your Tangelo widget");
                    } else if (key !== "_create") {
                        ptype[key] = spec[key];
                    }
                }
            }

            $.widget(name, $.tangelo.widget, ptype);
        };
    }
}(window.tangelo, window.jQuery));
