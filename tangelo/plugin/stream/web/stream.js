(function (tangelo, $, _) {
    "use strict";

    var streamPlugin = tangelo.getPlugin("stream");

    streamPlugin.streams = function (callback) {
        $.ajax({
            url: tangelo.pluginUrl("stream", "stream"),
            type: "GET",
            dataType: "json",
            error: function (jqxhr) {
                callback(undefined, jqxhr);
            },
            success: function (data) {
                callback(data);
            }
        });
    };

    streamPlugin.start = function (url, callback) {
        // Send an ajax request to get the stream started.
        $.ajax({
            url: tangelo.pluginUrl("stream", "stream", "start", tangelo.absoluteUrl(url)),
            type: "POST",
            dataType: "json",
            error: function (jqxhr) {
                var report = {
                    status: jqxhr.status,
                    statusText: jqxhr.statusText,
                    description: JSON.parse(jqxhr.responseText).error,
                    jqxhr: jqxhr
                };
                callback(undefined, report);
            },
            success: function (data) {
                callback(data.key);
            }
        });
    };

    /*jslint unparam: true */
    streamPlugin.query = function (key, callback) {
        $.ajax({
            url: tangelo.pluginUrl("stream", "stream", "next", key),
            type: "POST",
            dataType: "json",
            error: function (jqxhr) {
                var report = {
                    status: jqxhr.status,
                    statusText: jqxhr.statusText,
                    description: JSON.parse(jqxhr.responseText).error,
                    jqxhr: jqxhr
                };
                callback(undefined, undefined, report);
            },
            success: function (result, status, jqxhr) {
                if (jqxhr.status === 204) {
                    callback(undefined, true);
                } else {
                    callback(result, false);
                }
            }
        });
        /*jslint unparam: true */
    };

    streamPlugin.run = function (key, callback, delay) {
        // NOTE: we can't "shortcut" this (e.g. "delay = delay || 100") because
        // this will prevent the user from passing "0" in as the delay argument.
        if (delay === undefined) {
            delay = 100;
        }

        // Perform a stream query, using setTimeout to cause this function to
        // recur (in a way that does not indefinitely deepen the stack) until
        // there is an error, or the stream runs out.
        streamPlugin.query(key, function (result, finished, error) {
            var flag,
                keepgoing = true;

            if (error) {
                console.warn("[tangelo.stream.run()] error during stream query");
                callback(undefined, undefined, error);
                return;
            }

            if (finished) {
                // Call the callback one last time to signal the end of the
                // stream, without any followup setTimeout().
                callback(undefined, true);
            } else {
                // Invoke the callback, and if it returns a value, inspect it to
                // possibly affect how to continue:
                //
                // - If the callback returns a function, use that function as
                //   the new callback for future queries to the stream.
                //
                // - If it returns a boolean, use that value to decide whether
                //   to stop processing the stream immediately.
                //
                // - If it returns a number, use that value as the new delay
                //   between stream queries.
                //
                // - If it returns an object, assume the function is attempting
                //   to set more than one of these parameters in one go.
                flag = callback(result, false);
                if (flag !== undefined) {
                    if (_.isFunction(flag)) {
                        callback = flag;
                    } else if (_.isBoolean(flag)) {
                        keepgoing = flag;
                    } else if (_.isNumber(flag)) {
                        delay = flag;
                    } else if (_.isObject(flag) && !_.isArray(flag)) {
                        if (flag.callback !== undefined) {
                            callback = flag.callback;
                        }

                        if (flag.continue !== undefined) {
                            keepgoing = flag.continue;
                        }

                        if (flag.delay !== undefined) {
                            delay = flag.delay;
                        }
                    }
                }

                // Schedule a new call to this function, with possibly mutated
                // parameters, after the specified delay.
                if (keepgoing) {
                    window.setTimeout(streamPlugin.run, delay, key, callback, delay);
                }
            }
        });
    };

    streamPlugin.delete = function (key, callback) {
        $.ajax({
            url: tangelo.pluginUrl("stream", "stream", key),
            dataType: "json",
            type: "DELETE",
            error: function (jqxhr) {
                if (callback) {
                    callback(undefined, jqxhr);
                }
            },
            success: function (result) {
                if (callback) {
                    callback(result.key);
                }
            }
        });
    };
}(window.tangelo, window.$, window._));
