var key;

// Method call at exit time
function stop() {
    req = d3.xhr("/vtkweb/" + key);
    req.send("DELETE", function (e, resp) {
        if (resp.status !== "complete") {
            console.log("error: could not shut down vtkweb process");
        }
    });
}

window.onunload = window.onbeforeunload = stop;

window.onload = function () {
    proc = d3.json("/vtkweb/app/vtkweb/vtkweb_cone.py");
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
            name: "Cone",
            description: "Simple VTK Web demo application",
            application: "cone"
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
