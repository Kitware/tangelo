/*jslint */

/*global tangelo, d3, console, $ */

(function () {
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
                if (response.error !== null || response.result.data.length === 0) {
                    max = null;

                    if (response.error !== null) {
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
                        if (response.error !== null || response.result.data.length === 0) {
                            min = null;

                            if (response.error !== null) {
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
        // If there is a problem with the file, it may be that it is not
        // expected to be there at all, so silently supply an empty defaults
        // table.  The err argument is passed in case the client WAS expecting
        // the defaults file to be read in, and wants to examine the error.
        d3.json(inputfile, function (err, json) {
            callback(json || {}, err);
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
}());
