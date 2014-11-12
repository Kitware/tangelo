// Attempts to retrieve a JSON-encoded configuration from `url`.  On success,
// the JSON object is passed to `callback`.  If there is not a file at `url`,
// and `required` is set to false, `callback` is invoked with an empty object.
// An error results in `callback` being invoked with undefined as the first
// argument and the error string as the second.  The `required` parameter can be
// omitted, and defaults to false in that case.
tangelo.getPlugin("config").config = function (url, required, callback) {
    var url,
        required,
        callback,
        inputfile;

    if (url === undefined) {
        throw new Error("'url' parameter is required");
    }

    // This allows a default value for the `required` parameter.
    if (callback === undefined && tangelo.isFunction(required)) {
        callback = required;
        required = false;
    }

    // Convert the URL to an absolute URL.
    url = tangelo.absoluteUrl(url);

    // Fire the request to the config service.
    $.ajax({
        url: tangelo.pluginUrl("config", "config", url),
        dataType: "json",
        error: function (jqxhr) {
            switch (jqxhr.statusCode()) {
                case 400:
                    callback(undefined, jqxhr.response.error, jqxhr);
                    break;

                case 404:
                    if (required) {
                        callback(undefined, jqxhr.response.error, jqxhr);
                    } else {
                        // Pass in an empty config if the user did not require a
                        // configuration file to be found.
                        callback({});
                    }
                    break;

                default:
                    callback(undefined, undefined, jqxhr);
                    break;
            }
        },
        success: function (data) {
            callback(data.result);
        }
    });
};
