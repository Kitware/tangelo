/*jslint browser: true */

// Export a global module.
var tangelo = {};

(function () {
    "use strict";

    // Tangelo version number.
    tangelo.version = function () {
        return "0.5-dev1";
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

        if (spec === undefined || Object.keys(spec).length === 0) {
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

    // Check for the required version number.
    tangelo.requireCompatibleVersion = function (reqvstr) {
        var reqv,
            tanv,
            compatible,
            parse;

        // This function parses out the structure of a version string.
        //
        // Major version 0 version numbers contain only two parts: 0.MINOR
        //
        // Major version 1 version numbers contain three parts:
        // MAJOR.MINOR.PATCH
        //
        // Any version number may also have a trailing hyphen followed by one or
        // more non-space, non-hyphen characters: 0.MINOR-TAG, or
        // MAJOR.MINOR.PATCH-TAG
        //
        // The minor and patch numbers may be omitted; they will be filled in
        // with 0s as appropriate.
        //
        // Negative numbers and non-number strings are not allowed in the
        // version number components.
        tangelo.parse = function (s) {
            var parts,
                ver,
                tag,
                i,
                components;

            parts = s.split("-");
            if (parts.length > 1) {
                ver = parts.slice(0, -1).join("-");
                tag = parts.slice(-1)[0];
            } else {
                ver = parts[0];
                tag = parts[1];
            }

            if (!ver) {
                return null;
            }

            if (tag !== undefined && (tag.length === 0 || tag.indexOf(" ") !== -1)) {
                return null;
            }

            ver = ver.split(".").map(function (x) {
                return +x;
            });

            if (ver.length === 0) {
                return null;
            }

            for (i = 0; i < ver.length; i += 1) {
                if (isNaN(ver[i]) || ver[i] < 0) {
                    return null;
                }
            }

            components = ver[0] === 0 ? 2 : 3;
            if (ver.length > components) {
                return null;
            }

            for (i = ver.length; i < components; i += 1) {
                ver[i] = 0;
            }

            return {
                version: ver,
                tag: tag
            };
        };

        // Parse out the structures of the required version string, and the
        // current Tangelo version string.
        reqv = tangelo.parse(reqvstr);
        tanv = tangelo.parse(tangelo.version());

        // If either of them fails to parse, raise a fatal error.
        if (!tanv) {
            tangelo.fatalError("tangelo.requireCompatibleVersion()", "tangelo version number is invalid: " + tangelo.version());
        } else if (!reqv) {
            tangelo.fatalError("tangelo.requireCompatibleVersion()", "invalid version string: " + reqvstr);
        }

        // Run the compatibility rules.
        if (reqv.tag || tanv.tag || reqv.version[0] === 0 || tanv.version[0] === 0) {
            // If either version has a tag, or if the major version is 0, then
            // the versions must match exactly.
            compatible = reqv.tag === tanv.tag &&
                         reqv.version[0] === tanv.version[0] &&
                         reqv.version[1] === tanv.version[1] &&
                         reqv.version[2] === tanv.version[2];
        } else {
            // If there are no tags, and the major version is greater than 0,
            // then the major versions MUST match, and the required minor
            // version MUST be at most the Tangelo minor version.  If the minor
            // versions are equal, then the required patch level MUST be at most
            // the Tangelo patch level.
            compatible = reqv.version[0] === tanv.version[0] &&
                         (reqv.version[1] < tanv.version[1] || (reqv.version[1] === tanv.version[1] && reqv.version[2] <= tanv.version[2]));
        }

        return compatible;
    };
}(window.$));
