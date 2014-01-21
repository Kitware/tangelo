/*jslint browser: true */

/*globals d3, vtkWeb, $, tangelo */

var app = {};
app.key = null;

// This will end whatever process is currently running, if any, and clear the UI
// elements.
function terminate() {
    "use strict";

    if (app.key) {
        tangelo.vtkweb.terminate(app.key);
        app.key = null;
    }

    d3.select("#launch")
        .classed("disabled", false);

    d3.select("#terminate")
        .classed("disabled", true);
}

function launch() {
    "use strict";

    // Clear out any existing process.
    terminate();

    tangelo.vtkweb.launch({
        url: "vtkweb_cone.py",
        viewport: "#viewport",
        callback: function (key, error) {
            if (error) {
                console.warn("error!");
                console.warn(error);
                return;
            }

            app.key = key;

            d3.select("#launch")
                .classed("disabled", true);

            d3.select("#terminate")
                .classed("disabled", false);
        }
    });
}

$(function () {
    "use strict";

    // When the page is closed, make sure to close any processes that were running.
    window.onbeforeunload = window.onunload = terminate;

    // Install actions on the buttons.
    d3.select("#launch")
        .on("click", launch);

    // If a vtk web process has been launched, then shut it down.
    d3.select("#terminate")
        .classed("disabled", true)
        .on("click", terminate);
});
