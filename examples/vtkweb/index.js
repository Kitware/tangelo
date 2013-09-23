/*jslint browser: true */

/*globals d3, vtkWeb, $ */

var app = {};
app.key = null;
app.viewport = null;

// This will end whatever process is currently running, if any, and clear the UI
// elements.
function endProcess() {
    "use strict";

    var req;

    // Do nothing if the global key is not set.
    if (app.key !== null) {
        // Engage the REST API to shut down the process.
        req = d3.json("/vtkweb/" + app.key);
        req.send("DELETE", function (e, resp) {
            if (resp.status !== "complete") {
                console.log("could not shut down process keyed by " + app.key + ": " + resp.reason);
            }
        });

        // Unbind the viewport and clear its contents.
        app.viewport.unbind();
        $("#viewport").empty();

        // Unset the global application key.
        app.key = null;
    }
}

function startProcess(pathUrl, name) {
    "use strict";

    var req;

    // Clear out any existing process.
    endProcess();

    // Engage the REST API to launch a new process.
    req = d3.json("/vtkweb" + pathUrl);
    req.post(function (e, resp) {
        var connection;

        if (resp.status !== "complete") {
            throw "could not start vtk_web_cone.py: " + resp.reason;
        }

        // Save the application key so it can be shut down later.
        app.key = resp.key;

        // Perform the vtkweb connection.
        connection = {
            sessionURL: resp.url,
            name: name,
            description: "VTKWeb demo: " + name,
            application: name
        };

        vtkWeb.connect(connection, function (serverConnection) {
            connection = serverConnection;

            app.viewport = vtkWeb.createViewport({session: connection.session});
            app.viewport.bind("#viewport");

            $(window).resize(function () {
                if (app.viewport) {
                    app.viewport.render();
                }
            }).trigger("resize");
        }, function (code, reason) {
            throw reason;
        });
    });
}

function startCone() {
    "use strict";

    startProcess("/app/vtkweb/vtk_web_cone.py?progargs=", "cone");
}

function startPhylo() {
    "use strict";

    startProcess("/app/vtkweb/vtkweb_tree.py?progargs=" + encodeURIComponent("--tree /home/roni/work/ArborWebApps/vtk-phylo-app/data/anolis.phy --table /home/roni/work/ArborWebApps/vtk-phylo-app/data/anolisDataAppended.csv"), "tree");
}

// When the page is closed, make sure to close any processes that were running.
window.onbeforeunload = window.onunload = endProcess;

$(function () {
    "use strict";

    // Install actions on the buttons.
    //
    // Launch the cone example.
    d3.select("#cone")
        .on("click", startCone);

    // Launch the phyologenetic tree example.
    d3.select("#phylo")
        .on("click", startPhylo);

    // If a vtk web process has been launched, then shut it down.
    d3.select("#close")
        .on("click", function () {
            if (app.key !== null) {
                endProcess(app.key);
            }
        });
});
