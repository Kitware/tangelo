/*jslint browser: true */
/*globals phantom */

// This is a script for PhantomJS to run.  It retrieves the coverage testing
// webpage and parses out the percentage coverage from it.  This script will
// drive the actual test case for JS coverage.

var system = require('system');

/**
 * Wait until the test condition is true or a timeout occurs. Useful for waiting
 * on a server response or for a ui change (fadeIn, etc.) to occur.
 *
 * @param testFx javascript callback that evaluates to a boolean.
 *
 * @param onReady callback to invoke when testFx condition is fulfilled.
 *
 * @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
 */
function waitFor(testFx, onReady, timeOutMillis) {
    "use strict";

    var maxtimeOutMillis = timeOutMillis || 3001, //< Default Max Timeout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function () {
            if ((new Date().getTime() - start < maxtimeOutMillis) && !condition) {
                // If not time-out yet and condition not yet fulfilled
                condition = testFx();
            } else {
                if (!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    console.log("'waitFor()' timeout");
                    phantom.exit(1);
                } else {
                    // Condition fulfilled (timeout and/or condition is 'true')
                    //
                    // Do what it's supposed to do once the condition is
                    // fulfilled.
                    onReady();

                    clearInterval(interval); //< Stop this interval
                }
            }
        }, 100); //< repeat check every 100ms
}


if (system.args.length !== 3) {
    console.log('Usage: blanket-test.js URL threshold');
    phantom.exit(1);
}

var url = system.args[1];
var threshold = system.args[2];

var page = require('webpage').create();

// Route "console.log()" calls from within the Page context to the main Phantom
// context (i.e. current "this")
page.onConsoleMessage = function (msg) {
    "use strict";

    console.log(msg);
};

page.open(url, function (status) {
    "use strict";

    if (status !== "success") {
        console.log("Unable to access network");
        phantom.exit(1);
    } else {
        waitFor(function () {
            return page.evaluate(function () {
                return document.body.querySelector('#blanket-main') !== null;
            });
        }, function () {
            var percent = page.evaluate(function () {
                var el = document.querySelector(".blanket.bl-error .bl-cl.rs"),
                    text,
                    pct;

                if (!el) {
                    console.log("error: could not retrieve the coverage percentage from the test results");
                    return null;
                }

                text = el.innerText.split(" ")[0];
                pct = +text;
                if (isNaN(pct)) {
                    console.log("error: got non-numeric value '" + text + "' for coverage percentage");
                    return null;
                }

                return pct;
            });

            if (percent === null) {
                phantom.exit(1);
            } else {
                console.log("coverage is " + percent + "%, threshold for passing is " + threshold + "%");
                phantom.exit(percent < threshold);
            }
        });
    }
});
