/*jslint browser: true */

/*globals d3, vtkWeb, $, tangelo */

var app = {};
app.key = null;

// This will end whatever process is currently running, if any, and clear the UI
// elements.
function endProcess() {
    "use strict";

    if (app.key) {
        tangelo.vtkweb.terminate(app.key);
        app.key = null;
    }
}

function startProcess(pathUrl, argstring) {
    "use strict";

    // Clear out any existing process.
    endProcess();

    tangelo.vtkweb.launch({
        url: pathUrl,
        argstring: argstring || "",
        viewport: "#viewport",
        callback: function (key, error) {
            if (error) {
                console.warn("error!");
                console.warn(error);
                return;
            }

            app.key = key;
        }
    });
}

function startCone() {
    "use strict";

    startProcess("vtkweb_cone.py");
}

function startPhylo() {
    "use strict";

    startProcess("vtkweb_tree.py",
                 "--tree /home/roni/work/ArborWebApps/vtk-phylo-app/data/anolis.phy " +
                 "--table /home/roni/work/ArborWebApps/vtk-phylo-app/data/anolisDataAppended.csv");
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
        .on("click", endProcess);
});
