/*jslint browser: true */

(function (tangelo, $) {
    "use strict";

    tangelo.getMongoRange = function (host, db, coll, field, callback) {
        var min,
            max,
            mongourl;

        // The base URL for both of the mongo service queries.
        mongourl = "/service/mongo/" + host + "/" + db + "/" + coll;

        // Fire an ajax call to retrieve the maxmimum value.
        $.ajax({
            url: mongourl,
            data: {
                sort: JSON.stringify([[field, -1]]),
                limit: 1,
                fields: JSON.stringify([field])
            },
            dataType: "json",
            success: function (response) {
                // If the value could not be retrieved, set it to null and print
                // an error message on the console.
                if (response.error || response.result.data.length === 0) {
                    max = null;

                    if (response.error) {
                        throw "[tangelo.getMongoRange()] error: could not retrieve max value from " + host + ":/" + db + "/" + coll + ":" + field;
                    }
                } else {
                    max = response.result.data[0][field];
                }

                // Fire a second query to retrieve the minimum value.
                $.ajax({
                    url: mongourl,
                    data: {
                        sort: JSON.stringify([[field, 1]]),
                        limit: 1,
                        fields: JSON.stringify([field])
                    },
                    dataType: "json",
                    success: function (response) {
                        // As before, set the min value to null if it could not
                        // be retrieved.
                        if (response.error || response.result.data.length === 0) {
                            min = null;

                            if (response.error) {
                                throw "[tangelo.getMongoRange()] error: could not retrieve min value from " + host + ":/" + db + "/" + coll + ":" + field;
                            }
                        } else {
                            min = response.result.data[0][field];
                        }

                        // Pass the range to the user callback.
                        callback(min, max);
                    }
                });
            }
        });
    };

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
