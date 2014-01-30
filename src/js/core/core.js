/*jslint browser: true */

// Export a global module.
var tangelo = {};

(function () {
    "use strict";

    // Tangelo version number.
    tangelo.version = function () {
        return "0.5.dev1";
    };

    tangelo.fatalError = function (module, msg) {
        if (msg === undefined) {
            msg = module;
            throw new Error(msg);
        }

        throw new Error("[" + module + "] " + msg);
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
            tangelo.fatalError("JavaScript include error: " + plugin + " requires " + required);
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

    tangelo.isFunction = function (value) {
        return Object.prototype.toString.call(value) === '[object Function]';
    };

    tangelo.absoluteUrl = function (path) {
        var trailing_slash = window.location.pathname[window.location.pathname.length - 1] === "/";

        if (path.length > 0) {
            if (path[0] !== "/" && path[0] !== "~") {
                path = window.location.pathname + (trailing_slash ? "" : "/") + path;
            }
        }

        return path;
    };

    tangelo.accessor = function (spec, defaultValue) {
        var parts,
            func,
            key;

        // Need a way to "clone" a function, so we can put properties on the
        // clone without affecting the original.  Code adapted from
        // http://stackoverflow.com/a/11230005/1886928).
        Function.prototype.clone = function () {
            var cloneObj = this,
                temp;

            if (this.__isClone) {
                cloneObj = this.__clonedFrom;
            }

            temp = function () {
                return cloneObj.apply(this, arguments);
            };

            for (key in this) {
                temp[key] = this[key];
            }

            temp.__isClone = true;
            temp.__clonedFrom = cloneObj;

            return temp;
        };

        if (spec === undefined || spec === {}) {
            func = function () {
                tangelo.fatalError("tangelo.accessor()", "I am an undefined accessor - you shouldn't be calling me!");
            };
            func.undefined = true;
        } else if (tangelo.isFunction(spec)) {
            func = spec.clone();
        } else if (!spec) {
            func = function () { return defaultValue; };
        } else if (spec.hasOwnProperty("value")) {
            func = function () { return spec.value; };
        } else if (spec.hasOwnProperty("index")) {
            func = function (d, i) { return i; };
        } else if (spec.hasOwnProperty("field")) {
            if (spec.field === ".") {
                func = function (d) { return d; };
                //return tangelo.identity;
            } else {
                parts = spec.field.split(".");
                func = function (d) {
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
        } else {
            tangelo.fatalError("tangelo.accessor()", "unknown accessor spec " + spec);
        }

        func.accessor = true;
        return func;
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
            dev,
            parse,
            components,
            hasNaN = function (values) {
                var i;

                for (i = 0; i < values.length; i += 1) {
                    if (isNaN(values[i])) {
                        return true;
                    }
                }

                return false;
            };

        // A function to parse the version number out.
        parse = function () {
            var isDev = false;

            return function (x) {
                var bad = false,
                    retval,
                    dev;

                if (isDev) {
                    bad = true;
                } else if (isNaN(+x)) {
                    if (x.slice(0, 3) === "dev") {
                        isDev = true;

                        dev = +x.slice(3);
                        if (isNaN(dev)) {
                            bad = true;
                        }

                        retval = -dev;
                    }
                } else {
                    retval = +x;
                }

                if (bad) {
                    tangelo.fatalError("tangelo.requireCompatibleVersion()", "illegal argument '" + reqvstr + "'");
                }

                return retval;
            };
        };

        // Split the argument out into major, minor, and patch version numbers.
        reqv = reqvstr.split(".").map(parse());

        // Check for: blank argument, too long argument, non-version-number
        // argument.
        if (reqv.length === 0 || reqv.length > 3 || hasNaN(reqv)) {
            tangelo.fatalError("tangelo.requireCompatibleVersion()", "illegal argument '" + reqvstr +  "'");
        }

        // Fill in any missing trailing values (i.e., "1.0" -> "1.0.0", but
        // "1.dev3" -> "1.0.0.dev3").
        dev = reqv.slice(-1)[0];
        if (dev < 0) {
            reqv = reqv.slice(0, -1);
        }
        if (reqv[0] === 0) {
            components = 2;
        } else {
            components = 3;
        }
        for (i = reqv.length; i < components; i += 1) {
            reqv[i] = 0;
        }
        if (dev < 0) {
            reqv.push(dev);
        }

        // Split the Tangelo version number into major, minor, and patch level
        // as well.
        tanv = tangelo.version().split(".").map(parse());

        // Compatibility between versions is defined as follows:
        //
        // If the either version is a development version, then all components
        // MUST MATCH.
        //
        // For non-development versions, In order to be compatible above major
        // version 0: (1) the major versions MUST MATCH; (2) the required minor
        // version MUST BE AT MOST the Tangelo minor version number; and (3) the
        // required patch level MUST BE AT MOST the Tangelo patch level.
        //
        // For major version 0, in order to be compatible: (1) the major
        // versions MUST BOTH BE 0; (2) and the minor versions MUST MATCH.
        if (dev < 0 || tanv.slice(-1)[0] < 0) {
            compatible = reqv[0] === tanv[0] && reqv[1] === tanv[1] && reqv[2] === tanv[2] && reqv[3] === tanv[3];
        } else if (reqv[0] === 0) {
            compatible = tanv[0] === 0 && reqv[1] === tanv[1];
        } else {
            compatible = reqv[0] === tanv[0] && reqv[1] <= tanv[1] && reqv[2] <= tanv[2];
        }

        return compatible;
    };

}(window.$));
