// Attempts to retrieve a JSON-encoded configuration from `url`.  On success,
// the JSON object is passed to `callback`.  If there is not a file at `url`,
// and `required` is set to false, `callback` is invoked with an empty object.
// An error results in `callback` being invoked with undefined as the first
// argument and the error string as the second.  The `required` parameter can be
// omitted, and defaults to false in that case.
(function (tangelo, _, $) {
    "use strict";

    tangelo.getPlugin("config").config = function (url, required, callback) {
        if (url === undefined) {
            throw new Error("'url' parameter is required");
        }

        // This allows a default value for the `required` parameter.
        if (callback === undefined && _.isFunction(required)) {
            callback = required;
            required = false;
        }

        // Convert the URL to an absolute URL.
        url = tangelo.absoluteUrl(url);

        // Fire the request to the config service.
        $.ajax({
            url: tangelo.pluginUrl("config", "config", url + (required ? "?required" : "")),
            dataType: "json",
            error: function (jqxhr) {
                switch (jqxhr.status) {
                    case 400: {
                        callback(undefined, jqxhr.responseJSON, jqxhr);
                        break;
                    }

                    default: {
                        callback(undefined, undefined, jqxhr);
                        break;
                    }
                }
            },
            success: function (data) {
                if (data.result) {
                    callback(data.result);
                } else {
                    callback(undefined, data);
                }
            }
        });
    };
}(window.tangelo, window._, window.jQuery));
