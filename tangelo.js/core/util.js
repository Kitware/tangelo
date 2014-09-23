/*jslint browser: true */

(function (tangelo, $) {
    "use strict";

    // Returns a key-value store containing the configuration options encoded in
    // the inputfile.
    if (!$) {
        tangelo.config = tangelo.unavailable({
            plugin: "tangelo.config",
            required: "JQuery"
        });
    } else {
        tangelo.config = function (inputfile, callback) {
            var path = window.location.pathname;

            // If the current location ends in a filename, compute the
            // containing directory before appending the input file name.
            if (path.slice(-1) !== "/") {
                path = window.location.pathname.split("/").slice(0, -1).join("/");
            }

            if (inputfile.length > 0) {
                if (inputfile[0] !== "/" && inputfile[0] !== "~") {
                    inputfile = path + "/" + inputfile;
                }
            }

            $.ajax({
                url: "/service/config",
                data: {
                    path: inputfile
                },
                dataType: "json",
                error: function (jqxhr) {
                    // If the ajax call fails, pass the request object to the
                    // function so the client can examine it.
                    callback(undefined, undefined, jqxhr);
                },
                success: function (data) {
                    // If successful, check for errors in the execution of the
                    // service itself, passing that error to the callback if
                    // necessary.  Otherwise, pass the status and data along to the
                    // callback.
                    if (data.error) {
                        callback(undefined, undefined, tangelo.error(tangelo.error.APPLICATION_ERROR, data.error));
                    } else {
                        callback(data.result, data.status);
                    }
                }
            });
        };
    }

    // Returns a unique ID for use as, e.g., ids for dynamically generated html
    // elements, etc.
    tangelo.uniqueID = (function () {
        var ids = {"": true},
            letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

        return function (n) {
            var id = "",
                i;

            n = n || 6;

            //while (id in ids) {
            while (ids.hasOwnProperty(id)) {
                id = "";
                for (i = 0; i < n; i += 1) {
                    id += letters[Math.floor(Math.random() * 52)];
                }
            }

            ids[id] = true;

            return id;
        };
    }());

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

    tangelo.accessor = function (spec) {
        var parts,
            func;

        // Need a way to "clone" a function, so we can put properties on the
        // clone without affecting the original.  Code adapted from
        // http://stackoverflow.com/a/11230005/1886928).
        Function.prototype.clone = function () {
            /*jslint nomen: true */
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
            /*jslint nomen: true */

            return temp;
        };

        if (spec === undefined || (tangelo.isObject(spec) && Object.keys(spec).length === 0)) {
            func = function () {
                tangelo.fatalError("tangelo.accessor()", "I am an undefined accessor - you shouldn't be calling me!");
            };
            func.undefined = true;
        } else if (tangelo.isFunction(spec)) {
            func = spec.clone();
        } else if (spec.hasOwnProperty("value")) {
            func = function () { return spec.value; };
        } else if (spec.hasOwnProperty("index")) {
            /*jslint unparam: true */
            func = function (d, i) { return i; };
            /*jslint unparam: false */
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
            tangelo.fatalError("tangelo.accessor()", "unknown accessor spec " + spec);
        }

        func.accessor = true;
        return func;
    };

}(window.tangelo, window.jQuery));
