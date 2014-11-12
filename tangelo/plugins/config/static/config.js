// Returns a key-value store containing the configuration options encoded in the
// inputfile.
tangelo.getPlugin("config").config = function (cfg) {
    var url,
        required,
        callback,
        inputfile;

    // Get configuration parameters.
    cfg = cfg || {};
    url = cfg.url;
    required = cfg.required || false;
    callback = cfg.callback || $.noop;

    if (url === undefined) {
        throw new Error("'url' parameter is required");
    }

    inputfile = tangelo.absoluteUrl(url);
/*    var path = window.location.pathname;*/

    //// If the current location ends in a filename, compute the
    //// containing directory before appending the input file name.
    //if (path.slice(-1) !== "/") {
        //path = window.location.pathname.split("/").slice(0, -1).join("/");
    //}

    //if (inputfile.length > 0) {
        //if (inputfile[0] !== "/" && inputfile[0] !== "~") {
            //inputfile = path + "/" + inputfile;
        //}
    //}

    $.ajax({
        url: "/service/config",
        data: {
            path: inputfile
        },
        dataType: "json",
        error: function (jqxhr) {
            // If the ajax call fails, pass the request object to the
            // function so the client can examine it.
            callback(undefined, undefined, jqxhr);
        },
        success: function (data) {
            // If successful, check for errors in the execution of the
            // service itself, passing that error to the callback if
            // necessary.  Otherwise, pass the status and data along to the
            // callback.
            if (data.error) {
                callback(undefined, data.error, undefined);
            } else {
                callback(data.result);
            }
        }
    });
};
