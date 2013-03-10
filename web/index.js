/*jslint browser: true */

/*global d3 */

window.onload = function () {
    "use strict";

    d3.json("/apps.json", function (err, spec) {
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
            console.log("fatal error: could not load app list from /apps.json");
            return;
        }

        // Pull out the two lists in the specification - one for the list of
        // apps, and one for the list of external links.
        apps = spec.apps;
        external = spec.external;

        // Grab a reference to each of the two index columns.
        left = d3.select("#left");
        right = d3.select("#right");
        cols = [left, right];

        // Place the app info/links into the two columns, alternating between
        // left and right.
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

        // List out the external links in the two columns, as above.
        left = d3.select("#external-left");
        right = d3.select("#external-right");
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
    });
};
