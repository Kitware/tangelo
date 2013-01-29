/*jslint browser: true */

/*global d3 */

window.onload = function () {
    "use strict";

    d3.json("/apps.json", function (err, apps) {
        if (err !== null) {
            console.log("fatal error: could not load app list from /apps.json");
            return;
        }

        // Grab a reference to each of the two index columns.
        var left = d3.select("#left"),
            right = d3.select("#right"),
            cols = [left, right],
            i,
            col,
            app;

        // Place the app info/links into the two columns, alternating between
        // left and right.
        for (i = 0; i < apps.length; i = i + 1) {
            col = cols[i % 2];
            app = apps[i];

            col.append("a")
                .attr("href", "/apps/" + app.path + "/index.html")
                .append("h4")
                    .html(app.name);
            col.append("p")
                .html(app.description);
        }
    });
};
