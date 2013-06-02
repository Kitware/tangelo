/*jslint browser:true */

/*global tangelo, d3 */

(function () {
    "use strict";

    var mod;

    mod = tangelo.namespace("util");

    mod.defaults = function (inputSpec, callback) {
        var //bad,
            k,
            notready,
            good,
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
        good = {
            set: function (key, value) {
                store[key] = value;
            },

            get: function (key) {
                return store[key];
            },
        };

/*        // Dummy object methods to prevent access to the store until the ajax*/
        //// callback in the "load from file" case finishes.
        //bad = {};
        //notready = function () {
            //throw mod.message("defaults", "defaults store not ready yet!");
        //};
        //for (k in good) {
            //if (good.hasOwnProperty(k)) {
                //bad[k] = notready;
            //}
        //}

        // Dispatch on the type of the input argument.
        if (typeof inputSpec === "string") {
            // A string argument - treat it as a JSON file.
            //
            // Initiate an ajax call to retrieve the file contents.
            d3.json(inputSpec, function (err, json) {
                if (err) {
                    console.log(mod.message("defaults", "could not read JSON file '" + inputSpec + "'"));
                }

                // Fill in the store with the file data.
                populate(json);

                console.log("store: " + JSON.stringify(store));

                // Convert the methods the user was given with the real methods.
                //bad = good;

                if (callback) {
                    callback(good);
                }
            });

            // Hand the user the dummy methods to prevent access until the data
            // is loaded.
            //
            //retval = bad;
            retval = good;
        } else if (typeof inputSpec === "object") {
            // An object argument - treat it as a hashtable of key/value pairs
            // representing default config values.
            //
            // Fill in the store.
            populate(inputSpec);

            // Give the user a method handle.
            retval = good;
        } else {
            retval = undefined;
            throw mod.message("defaults", "unexpected type in first argument: " + typeof inputSpec);
        }

        return retval;
    };
}());
