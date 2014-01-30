/*globals console, d3, jQuery, tangelo */

(function ($) {
    "use strict";

    $.fn.landingPage = function (cfg) {
        var specFile,
            appLeftSelector,
            appRightSelector,
            extLeftSelector,
            extRightSelector,
            container;

        // Pull values from the config object argument.
        specFile = cfg.specFile;
        appLeftSelector = cfg.appLeftSelector;
        appRightSelector = cfg.appRightSelector;
        extLeftSelector = cfg.extLeftSelector;
        extRightSelector = cfg.extRightSelector;

        // Create a d3 selection out of the target element.
        container = d3.select(this[0]);

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
                tangelo.fatalError("landingPage", "could not load app list from " + specFile);
                return;
            }

            // Pull out the two lists in the specification - one for the list of
            // apps, and one for the list of external links.
            apps = spec.apps;
            external = spec.external;

            if (apps !== undefined) {
                if (!appLeftSelector || !appRightSelector) {
                    tangelo.fatalError("landingPage", "required config argument property 'appLeftSelector' or 'appRightSelector' missing");
                }

                // Grab a reference to each of the two index columns.
                left = container.select(appLeftSelector);
                right = container.select(appRightSelector);
                cols = [left, right];

                // Place the app info/links into the two columns, alternating
                // between left and right.
                for (i = 0; i < apps.length; i = i + 1) {
                    col = cols[i % 2];
                    app = apps[i];

                    col.append("a")
                        .attr("href", app.path)
                        .append("h4")
                        .html(app.name);
                    col.append("p")
                        .html(app.description);
                }
            }

            if (external !== undefined) {
                if (!extLeftSelector || !extRightSelector) {
                    tangelo.fatalError("landingPage", "required config argument property 'extLeftSelector' or 'extRightSelector' missing!");
                }

                // List out the external links in the two columns, as above.
                left = container.select(extLeftSelector);
                right = container.select(extRightSelector);
                cols = [left, right];
                text = function (d) {
                    return "<h5><a href=\"" + d.link + "\">" + "<strong>" + d.name + "</strong>" + "</a>" + "</h5>" + d.description;
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
}(jQuery));
