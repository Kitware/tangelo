/*jslint browser: true */

(function (tangelo, $, vtkWeb) {
    "use strict";

    var plugin = tangelo.getPlugin("vtkweb");

    plugin.processes = function (callback) {
        $.ajax({
            url: tangelo.pluginUrl("vtkweb", "vtkweb"),
            dataType: "json",
            error: function (jqxhr) {
                callback(undefined, jqxhr);
            },
            success: function (keys) {
                // If there was an error, bail out.
                if (keys.error) {
                    throw new Error(keys.error);
                }

                // Otherwise, pass the list of keys to the callback.
                callback(keys);
            }
        });
    };

    plugin.info = function (key, callback) {
        $.ajax({
            url: tangelo.pluginUrl("vtkweb", "vtkweb", key),
            dataType: "json",
            error: function (jqxhr) {
                callback(undefined, jqxhr);
            },
            success: function (report) {
                callback(report);
            }
        });
    };

    (function () {
        var table = {};

        plugin.launch = function (cfg) {
            var data,
                url = tangelo.absoluteUrl(cfg.url),
                callback = cfg.callback,
                argstring = cfg.argstring,
                timeout = cfg.timeout,
                viewport = cfg.viewport;

            if (timeout !== undefined) {
                throw new Error("timeout argument unimplemented");
            }

            // Look for required arguments.
            if (url === undefined) {
                throw new Error("argument 'url' required");
            }

            if (viewport === undefined) {
                throw new Error("argument 'viewport' required");
            }

            // Construct data object for POST request.
            data = {
                program: url
            };
            if (argstring) {
                data.args = argstring;
            }

            // Fire off POST request to vtkweb service.
            $.ajax({
                url: tangelo.pluginUrl("vtkweb", "vtkweb", url),
                type: "POST",
                data: data,
                dataType: "json",
                error: function (jqxhr) {
                    callback(undefined, jqxhr);
                },
                success: function (report) {
                    var connection,
                        vp;

                    connection = {
                        sessionURL: report.url
                    };

                    vtkWeb.connect(connection, function (connection) {
                        // Create a viewport and bind it to the specified
                        // element/selector.
                        vp = vtkWeb.createViewport({session: connection.session});
                        vp.bind(viewport);

                        // Force refresh on resize.
                        $(window).resize(function () {
                            if (vp) {
                                vp.render();
                            }
                        });

                        // An initial render.
                        vp.render();

                        // Save the element and viewport for use in the
                        // terminate() function.
                        table[report.key] = {
                            element: $(viewport).get(0),
                            viewport: vp
                        };
                    }, function (code, reason) {
                        throw new Error("not connect to VTKWeb server [code " + code + "]: " + reason);
                    });

                    callback(report.key);
                }
            });
        };

        plugin.terminate = function (key, callback) {
            $.ajax({
                url: tangelo.pluginUrl("vtkweb", "vtkweb", key),
                type: "DELETE",
                dataType: "json",
                error: function (jqxhr) {
                    if (callback) {
                        callback(undefined, undefined, jqxhr);
                    }
                },
                success: function (response) {
                    var element;

                    if (!response.reason) {
                        table[key].viewport.unbind();
                        element = table[key].element;

                        delete table[key];
                    }

                    // The default action is to empty the target element after
                    // shutting down the vtkweb process - the user can override
                    // this by passing in a callback (e.g., if they wish to
                    // capture the last image, or notify some other ongoing
                    // process, or something like that).
                    if (callback) {
                        // The second argument will be undefined if there was no
                        // error; the other arguments are always passed.
                        callback(key, element, {error: response.reason});
                    } else if (element) {
                        $(element).empty();
                    }
                }
            });
        };
    }());
}(window.tangelo, window.jQuery, window.vtkWeb));
