(function (tangelo, _) {
    "use strict";

    // A function to generate a Tangelo plugin url.
    tangelo.pluginUrl = function (plugin) {
        if (plugin === undefined) {
            throw new Error("argument 'plugin' is required");
        }
        return [].concat("/plugin", plugin, Array.prototype.slice.call(arguments, 1)).join("/");
    };

    // Returns an object representing the query arguments (code taken from
    // https://developer.mozilla.org/en-US/docs/Web/API/window.location).
    tangelo.queryArguments = function () {
        var oGetVars = {},
            aItKey,
            nKeyId,
            aCouples;

        if (window.location.search.length > 1) {
            for (nKeyId = 0, aCouples = window.location.search.substr(1).split("&"); nKeyId < aCouples.length; nKeyId += 1) {
                aItKey = aCouples[nKeyId].split("=");
                oGetVars[decodeURI(aItKey[0])] = aItKey.length > 1 ? decodeURI(aItKey[1]) : "";
            }
        }

        return oGetVars;
    };

    tangelo.absoluteUrl = function (path) {
        var trailingSlash,
            pathname;

        trailingSlash = window.location.pathname[window.location.pathname.length - 1] === "/";

        // No trailing slash means the pathname references a file rather than a
        // directory, so strip off the final element.
        if (!trailingSlash) {
            pathname = window.location.pathname.split("/").slice(0, -1).join("/");
        } else {
            pathname = window.location.pathname;
        }

        if (path.length > 0) {
            if (path[0] !== "/" && path[0] !== "~") {
                path = pathname + (trailingSlash ? "" : "/") + path;
            }
        }

        return path;
    };

    tangelo.accessor = function (spec) {
        var parts,
            func;

        // Need a way to "clone" a function, so we can put properties on the
        // clone without affecting the original.  Code adapted from
        // http://stackoverflow.com/a/11230005/1886928).
        Function.prototype.clone = function () {
            // jscs: disable safeContextKeyword, disallowDanglingUnderscores
            var cloneObj = this,
                temp,
                key;

            if (this.__isClone) {
                cloneObj = this.__clonedFrom;
            }

            temp = function () {
                return cloneObj.apply(this, arguments);
            };

            for (key in this) {
                if (this.hasOwnProperty(key)) {
                    temp[key] = this[key];
                }
            }

            temp.__isClone = true;
            temp.__clonedFrom = cloneObj;

            return temp;
            // jscs: enable safeContextKeyword, disallowDanglingUnderscores
        };

        if (spec === undefined || (_.isObject(spec) && !_.isFunction(spec) && !_.isArray(spec) && _.keys(spec).length === 0)) {
            func = function () {
                throw new Error("undefined accessor is not callable");
            };
            func.undefined = true;
        } else if (_.isFunction(spec)) {
            func = spec.clone();
        } else if (spec.hasOwnProperty("value")) {
            func = function () {
                return spec.value;
            };
        } else if (spec.hasOwnProperty("index")) {
            func = function (d, i) {
                return i;
            };
        } else if (spec.hasOwnProperty("field")) {
            if (spec.field === ".") {
                func = function (d) {
                    return d;
                };
            } else {
                parts = spec.field.split(".");
                func = function (d) {
                    var i;
                    for (i = 0; i < parts.length; i += 1) {
                        d = d[parts[i]];
                        if (d === undefined) {
                            return undefined;
                        }
                    }
                    return d;
                };
            }
        } else {
            throw new Error("unknown accessor spec " + spec);
        }

        func.accessor = true;
        return func;
    };
}(window.tangelo, window._));
