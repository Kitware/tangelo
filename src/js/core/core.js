/*jslint browser: true */

// Export a global module.
var tangelo = {};

(function () {
    "use strict";

    // Tangelo version number.
    tangelo.version = function () {
        return "0.2.0";
    };

    // A function that generates an error-generating function, to be used for
    // missing dependencies (Google Maps API, JQuery UI, etc.).
    tangelo.unavailable = function (cfg) {
        var plugin = cfg.plugin,
            required = cfg.required,
            i,
            t;

        if (tangelo.isArray(required)) {
            if (required.length === 1) {
                required = required[0];
            } else if (required.length === 2) {
                required = required[0] + " and " + required[1];
            } else {
                t = "";
                for (i = 0; i < required.length - 1; i += 1) {
                    t += required[i] + ", ";
                }
                t += "and " + required[required.length - 1];

                required = t;
            }
        }

        return function () {
            throw "JavaScript include error: " + plugin + " requires " + required;
        };
    };

    tangelo.identity = function (d) { return d; };

    tangelo.isNumber = function (value) {
        return typeof value === 'number';
    };

    tangelo.isBoolean = function (value) {
        return typeof value === 'boolean';
    };

    tangelo.isArray = function (value) {
        return Object.prototype.toString.call(value) === '[object Array]';
    };

    tangelo.isObject = function (value) {
        return Object.prototype.toString.call(value) === '[object Object]';
    };

    tangelo.isString = function (value) {
        return Object.prototype.toString.call(value) === '[object String]';
    };

    tangelo.accessor = function (spec, defaultValue) {
        var parts;
        if (!spec) {
            return function () { return defaultValue; };
        }
        if (spec.value !== undefined) {
            return function () { return spec.value; };
        }
        if (spec.field) {
            if (spec.field === ".") {
                return tangelo.identity;
            }
            parts = spec.field.split(".");
            return function (d) {
                var i;
                for (i = 0; i < parts.length; i += 1) {
                    d = d[parts[i]];
                    if (d === undefined) {
                        return defaultValue;
                    }
                }
                return d;
            };
        }
        window.console.log("error: unknown accessor spec");
    };

    tangelo.appendFunction = function (f1, f2) {
        var that = this;
        if (!f1) {
            return f2;
        }
        if (!f2) {
            return f1;
        }
        return function () {
            f1.apply(that, arguments);
            f2.apply(that, arguments);
        };
    };

    // Check for the required version number.
    tangelo.requireCompatibleVersion = function (reqvstr) {
        var i,
            tanv,
            reqv,
            compatible,
            hasNaN = function (values) {
                var i;

                for (i = 0; i < values.length; i += 1) {
                    if (isNaN(values[i])) {
                        return true;
                    }
                }

                return false;
            };

        // Split the argument out into major, minor, and patch version numbers.
        reqv = reqvstr.split(".").map(function (x) { return +x; });

        // Check for: blank argument, too long argument, non-version-number
        // argument.
        if (reqv.length === 0 || reqv.length > 3 || hasNaN(reqv)) {
            throw "[tangelo.requireCompatibleVersion()] Illegal argument '" + reqvstr +  "'";
        }

        // Fill in any missing trailing values (i.e., "1.0" -> "1.0.0").
        for (i = reqv.length; i < 3; i += 1) {
            reqv[i] = 0;
        }

        // Split the Tangelo version number into major, minor, and patch level
        // as well.
        tanv = tangelo.version().split(".").map(function (x) { return +x; });

        // In order to be compatible above major version 0: (1) the major
        // versions MUST MATCH; (2) the required minor version MUST BE AT MOST
        // the Tangelo minor version number; and (3) the required patch level
        // MUST BE AT MOST the Tangelo patch level.
        //
        // For major version 0, in order to be compatible: (1) the major
        // versions MUST BOTH BE 0; (2) the minor versions MUST MATCH; (3) the
        // required patch level MUST BE AT MOST the Tangelo patch level.
        if (reqv[0] === 0) {
            compatible = tanv[0] === 0 && reqv[1] === tanv[1] && reqv[2] <= tanv[2];
        } else {
            compatible = reqv[0] === tanv[0] && reqv[1] <= tanv[1] && reqv[2] <= tanv[2];
        }

        return compatible;
    };

}(window.$));
