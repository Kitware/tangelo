/*jslint */

/*global tangelo, d3, console, window, $ */

/** 
 *
 * @fileOverview Provides generic utilities.
 */

(function () {
    "use strict";

    var mod;

    /**
     *
     * @name util
     *
     * @memberOf tangelo
     *
     * @namespace General utilities cutting across several application needs.
     */
    mod = tangelo.namespace("util");

    mod.drawer_size = function () {
        return 23;
    };

    mod.drawer_toggle = function (divsel, buttonsel) {
        var div,
            button,
            state,
            divheight,
            iconheight;

        // Use the selectors to grab the DOM elements.
        div = d3.select(divsel);
        button = d3.select(buttonsel);

        // Initially, the panel is open.
        state = 'uncollapsed';

        // The glyphicon halfings are around 22.875 pixels tall.
        iconheight = mod.drawer_size() + "px";

        // Save the original height of the panel.
        // This requires a DOM update to do this correctly, so we wait a second.
        // I have found that waiting less than 200ms can cause undefined behavior,
        // since there may be other callback that need to populate the panel.
        function updateHeight() {
            divheight = $(div.node()).height() + "px";
        }
        window.setTimeout(updateHeight, 1000);

        // This function, when called, will toggle the state of the panel.
        return function () {
            if (state === 'uncollapsed') {
                div.transition()
                    .duration(500)
                    .style("height", iconheight);

                button.classed("icon-chevron-down", false)
                    .classed("icon-chevron-up", true);

                state = 'collapsed';
            } else if (state === 'collapsed') {
                div.transition()
                    .duration(500)
                    .style("height", divheight);

                button.classed("icon-chevron-down", true)
                    .classed("icon-chevron-up", false);

                state = 'uncollapsed';
            } else {
                throw "Illegal state: " + state;
            }
        };
    };

    mod.getMongoRange = function (host, db, coll, field, callback) {
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
                        console.log("[tangelo.util.getMongoRange()] error: could not retrieve max value from " + host + ":/" + db + "/" + coll + ":" + field);
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
                                console.log("[tangelo.util.getMongoRange()] error: could not retrieve min value from " + host + ":/" + db + "/" + coll + ":" + field);
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

    mod.allDefined = function () {
        // Returns true if all arguments are defined; false otherwise.

        var i;

        for (i = 0; i < arguments.length; i += 1) {
            if (arguments[i] === undefined) {
                return false;
            }
        }

        return true;
    };

    mod.defaults = function (inputSpec, callback) {
        var k,
            notready,
            that,
            retval,
            store,
            populate,
            fns;

        // The hashtable to store the options.
        store = {};

        // A helper function that treats the input argument as an object and
        // copies its properties to the store.
        populate = function (data) {
            var k;

            for (k in data) {
                if (data.hasOwnProperty(k)) {
                    store[k] = data[k];
                }
            }
        };

        // The object methods.
        that = {
            set: function (key, value) {
                store[key] = value;
            },

            get: function (key) {
                return store[key];
            },
        };

        // Dispatch on the type of the input argument.
        if (typeof inputSpec === "string") {
            // A string argument - treat it as a JSON file.
            //
            // Initiate an ajax call to retrieve the file contents.
            d3.json(inputSpec, function (err, json) {
                // Fill in the store with the file data (or leave it blank if
                // there was a problem with loading the file).
                if (!err) {
                    populate(json);
                }

                // If a callback was supplied, invoke it on the defaults object.
                if (callback) {
                    callback(that);
                }
            });

            retval = undefined;
        } else if (typeof inputSpec === "object") {
            // An object argument - treat it as a hashtable of key/value pairs
            // representing default config values.
            //
            // Fill in the store.
            populate(inputSpec);

            // Give the user a method handle.
            retval = that;
        } else {
            retval = undefined;
            throw mod.message("defaults", "unexpected type in first argument: " + typeof inputSpec);
        }

        return retval;
    };
}());
