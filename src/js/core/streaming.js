/*jslint browser: true */

(function (tangelo, $) {
    "use strict";

    tangelo.getStreams = function (callback) {
        $.ajax({
            url: "/stream",
            dataType: "json",
            error: function (jqxhr) {
                callback(undefined, jqxhr);
            },
            success: function (data) {
                callback(data);
            }
        });
    };

    tangelo.queryStream = function (key, callback) {
        $.ajax({
            url: "/stream/" + key,
            dataType: "json",
            error: function (jqxhr) {
                callback(undefined, jqxhr);
            },
            success: function (data) {
                if (data.error) {
                    console.warn("[tangelo.queryStream] error: " + data.error);
                    return;
                }

                callback(data);
            }
        });
    };

    tangelo.runStream = function (key, callback, delay) {
        // NOTE: we can't "shortcut" this (e.g. "delay = delay || 100") because
        // this will prevent the user from passing "0" in as the delay argument.
        if (delay === undefined) {
            delay = 100;
        }

        // Make an ajax call, and in the error and success callbacks, use
        // setTimeout to fire this function again, etc.
        $.ajax({
            url: "/stream/" + key,
            dataType: "json",
            error: function (jqxhr) {
                console.warn("[tangelo.runStream] error: ajax call failed; aborting runStream operation");
                callback(undefined, jqxhr);
            },
            success: function (data) {
                var result,
                    keepgoing = true;

                if (data.error) {
                    console.warn("[tangelo.runStream] error: " + data.error + "; aborting runStream operation");
                    return;
                }

                // Invoke the callback, and if it returns a value, inspect
                // it to possibly affect how to continue.
                result = callback(data);
                if (result !== undefined) {
                    if (tangelo.isFunction(result)) {
                        // If the callback returns a new function, use that
                        // function for the next invocation of the stream.
                        callback = result;
                    } else if (tangelo.isBoolean(result)) {
                        // If the callback returns a boolean value, use that
                        // as a cue about whether to continue running the
                        // stream or not.
                        keepgoing = result;
                    } else if (tangelo.isNumber(result)) {
                        // If it returns a numerical value, use that as the
                        // new delay time.
                        delay = result;
                    }
                }

                // If we are meant to keep going, schedule this function to
                // run again after the specified delay.
                if (keepgoing) {
                    window.setTimeout(tangelo.runStream, delay, key, callback, delay);
                }
            }
        });
    };

    tangelo.deleteStream = function (key, callback) {
        $.ajax({
            url: "/stream/" + key,
            dataType: "json",
            type: "DELETE",
            error: function (jqxhr) {
                if (callback) {
                    callback(undefined, jqxhr);
                }
            },
            success: function (data) {
                if (callback) {
                    callback(data);
                }
            }
        });
    };

}(window.tangelo, window.$));
