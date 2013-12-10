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
    tangelo.defaults = function (inputfile, callback) {
        $.ajax({
            url: inputfile,
            dataType: "json",
            error: function (jqxhr) {
                // Call user's callback with an empty object as the data, to
                // cover the case where there is no defaults file, but this is
                // not to be seen as an error.  The second argument is the XHR
                // object, in case the client wishes to examine it.
                callback({}, jqxhr);
            },
            success: callback
        });
    };

    // Returns a unique ID for use as, e.g., ids for dynamically generated html
    // elements, etc.
    tangelo.uniqueID = (function () {
        var ids = {"": true};
        var letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

        return function (n) {
            var id = "",
                i;

            n = n || 6;

            while (id in ids) {
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
