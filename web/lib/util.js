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

    mod.svgColorLegend = function (cfg) {
        var bbox,
            bg,
            bottom,
            height,
            heightfunc,
            left,
            maxheight,
            maxwidth,
            right,
            text,
            top,
            totalheight,
            totalwidth,
            width,
            legend,
            cmap_func,
            xoffset,
            yoffset,
            categories,
            height_padding,
            width_padding,
            text_spacing,
            legend_margins,
            clear;

        // Extract arguments from the config argument.
        legend = cfg.legend;
        cmap_func = cfg.cmap_func;
        xoffset = cfg.xoffset;
        yoffset = cfg.yoffset;
        categories = cfg.categories;
        height_padding = cfg.height_padding;
        width_padding = cfg.width_padding;
        text_spacing = cfg.text_spacing;
        legend_margins = cfg.legend_margins;
        clear = cfg.clear;

        // Create a d3 selection from the legend argument.
        legend = d3.select(legend);

        // Clear the svg element, if requested.
        clear = clear || false;
        if (clear) {
            legend.selectAll("*").remove();
        }

        maxwidth = 0;
        maxheight = 0;

        // Place a rect that will serve as a container/background for the legend
        // list items.  Leave its dimensions undefined for now (they will be
        // computed from the size of all the elements later).
        bg = legend.append("rect")
            //.style("fill", "gray");
            .style("fill", "white")
            .style("opacity", 0.7);

        $.each(categories, function (i, d) {
            legend.append("rect")
                .classed("colorbox", true)
                .attr("x", xoffset)
                // "y", "width", and "height" intentionally left unset
                .style("fill", cmap_func(d));

            text = legend.append("text")
                .classed("legendtext", true)
                // "x" and "y" intentionally left unset
                .text(d);

            // Compute the max height and width out of all the text bgs.
            bbox = text[0][0].getBBox();

            if (bbox.width > maxwidth) {
                maxwidth = bbox.width;
            }

            if (bbox.height > maxheight) {
                maxheight = bbox.height;
            }
        });

        // Compute the height and width of each color swatch.
        height = maxheight + height_padding;
        width = height;

        // Compute the total height and width of all the legend items together.
        totalheight = height * categories.length;
        totalwidth = width + width_padding + maxwidth;

        // Get the user-supplied margin values.
        left = legend_margins.left || 0;
        top = legend_margins.top || 0;
        right = legend_margins.right || 0;
        bottom = legend_margins.bottom || 0;

        // Set the dimensions of the container rect, based on the height/width of
        // all the items, plus the user supplied margins.
        bg.attr("x", xoffset - left || 0)
            .attr("y", yoffset - top || 0)
            .attr("width", left + totalwidth + right)
            .attr("height", top + totalheight + bottom);

        heightfunc = function (d, i) {
            return yoffset + i * height;
        };

        legend.selectAll(".colorbox")
            .attr("width", height)
            .attr("height", height)
            .attr("y", heightfunc);

        legend.selectAll(".legendtext")
            .attr("x", xoffset + width + width_padding)
            .attr("y", function (d, i) {
                //return 19 + heightfunc(d, i);
                return text_spacing + heightfunc(d, i);
            });
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
