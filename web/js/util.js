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

    mod.landingPage = function (cfg) {
        var specFile,
            appLeftSelector,
            appRightSelector,
            extLeftSelector,
            extRightSelector;

        // Pull values from the config object argument.
        specFile = cfg.specFile;
        appLeftSelector = cfg.appLeftSelector;
        appRightSelector = cfg.appRightSelector;
        extLeftSelector = cfg.extLeftSelector;
        extRightSelector = cfg.extRightSelector;

        // Retrieve the contents of the specification file, then build up the
        // page.
        d3.json(specFile, function (err, spec) {
            var app,
                apps,
                col,
                cols,
                external,
                i,
                left,
                right,
                text;

            if (err !== null) {
                console.log("fatal error: could not load app list from " + specFile);
                return;
            }

            // Pull out the two lists in the specification - one for the list of
            // apps, and one for the list of external links.
            apps = spec.apps;
            external = spec.external;

            if (apps !== undefined) {
                if (!tangelo.util.allDefined(appLeftSelector, appRightSelector)) {
                    throw "Required config argument property appLeftSelector or appRightSelector missing!";
                }

                // Grab a reference to each of the two index columns.
                left = d3.select(appLeftSelector);
                right = d3.select(appRightSelector);
                cols = [left, right];

                // Place the app info/links into the two columns, alternating
                // between left and right.
                for (i = 0; i < apps.length; i = i + 1) {
                    col = cols[i % 2];
                    app = apps[i];

                    col.append("a")
                        .attr("href", "/app/" + app.path + "/")
                        .append("h4")
                        .html(app.name);
                    col.append("p")
                        .html(app.description);
                }
            }

            if (external !== undefined) {
                if (!tangelo.util.allDefined(extLeftSelector, extRightSelector)) {
                    throw "Required config argument property extLeftSelector or extRightSelector missing!";
                }

                // List out the external links in the two columns, as above.
                left = d3.select(extLeftSelector);
                right = d3.select(extRightSelector);
                cols = [left, right];
                text = function (d) {
                    return "<a href=\"" + d.link + "\">" + "<strong>" + d.name + "</strong>" + "</a>" +
                        " (<a href=\"" + d.institution_link + "\">" + d.institution + "</a>) - " +
                        d.description;
                };
                for (i = 0; i < external.length; i = i + 1) {
                    col = cols[i % 2];
                    app = external[i];

                    col.append("div")
                        .html(text(app));
                }
            }
        });
    };
}());
