var key;

// Method call at exit time
function stop() {
    alert("quitting!");

    if(false && connection.session) {
        viewport.unbind();
        connection.session.call('vtk:exit');
        connection.session.close();
        connection.session = null;
    }

    req = d3.xhr("/vtkweb?key=" + key);
    req.send("DELETE", function (e, resp) {
        if (resp.status !== "complete") {
            console.log("error: could not shut down vtkweb process");
        }
    });
}

window.onunload = window.onbeforeunload = stop;

window.onload = function () {
    proc = d3.json("/vtkweb/app/vtkweb/vtkweb_tree.py?progargs=" + encodeURIComponent("--tree /home/roni/work/ArborWebApps/vtk-phylo-app/data/anolis.phy --table /home/roni/work/ArborWebApps/vtk-phylo-app/data/anolisDataAppended.csv"));
    proc.post(function (e, resp) {
        console.log(resp);
        if (resp.status !== "complete") {
            console.log("oops :(");
            console.log(e);
            console.log(resp);
            return;
        }

        var connection = {
            sessionURL: resp.url,
            name: "WebTree",
            description: "Simple VTK Web demo application",
            application: "tree"
        },
        loading = $(".loading"),
        viewport = null;

        key = resp.key;

        console.log(connection.sessionURL);

        // Connect to remote server
        vtkWeb.connect(connection, function(serverConnection) {
            connection = serverConnection;

            // Create viewport
            viewport = vtkWeb.createViewport({session:connection.session});
            viewport.bind(".viewport-container");

            loading.hide();

            // Handle window resize
            $(window).resize(function() {
                if(viewport) {
                    viewport.render();
                }
            }).trigger('resize');
        }, function(code, reason) {
            loading.hide();
            alert(reason);
        });


        function updateView() {
            if(viewport) {
                viewport.invalidateScene();
            }
        }

    });
};
