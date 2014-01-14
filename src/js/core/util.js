/*jslint browser: true */

(function (tangelo, $) {
    "use strict";

    // Returns true if all arguments are defined; false otherwise.
    tangelo.allDefined = function () {
        var i;

        for (i = 0; i < arguments.length; i += 1) {
            if (arguments[i] === undefined) {
                return false;
            }
        }

        return true;
    };

    // Returns a key-value store containing the configuration options encoded in
    // the inputfile.
    if (!$) {
        tangelo.defaults = tangelo.unavailable({
            plugin: "tangelo.defaults",
            required: "JQuery"
        });
    }

    tangelo.defaults = function (inputfile, callback) {
        if (inputfile.length > 0) {
            if (inputfile[0] !== "/" && inputfile[0] !== "~") {
                inputfile = window.location.pathname + "/" + inputfile;
            }
        }

        $.ajax({
            url: "/service/defaults",
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
                    callback(undefined, undefined, data.error);
                } else {
                    callback(data.result, data.status);
                }
            }
        });
    };

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
}(window.tangelo, window.jQuery));
