/*jslint browser: true */
/*globals phantom */

// This is a script for PhantomJS to run.  It drives Jasmine testing by
// accepting a URL containing a Jasmine test suite, parsing that URL's contents
// for appropriate test report data, and summarizing the report on the console.
//
// This is adapted from the "run-jasmine.js" script that comes with PhantomJS.

var system = require('system');

/** Wait until the test condition is true or a timeout occurs. Useful for
 * waiting on a server response or for a ui change (fadeIn, etc.) to occur.
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
                    onReady(); //< Do what it's supposed to do once the condition is fulfilled
                    clearInterval(interval); //< Stop this interval
                }
            }
        }, 100); //< repeat check every 100ms
}

if (system.args.length !== 2) {
    console.log('Usage: run-jasmine.js URL');
    phantom.exit(1);
}

var page = require('webpage').create();

// Route "console.log()" calls from within the Page context to the main Phantom
// context (i.e.  current "this")
page.onConsoleMessage = function (msg) {
    "use strict";

    console.log(msg);
};

page.open(system.args[1], function (status) {
    "use strict";

    if (status !== "success") {
        console.log("Unable to access network");
        phantom.exit(1);
    } else {
        waitFor(function () {
            return page.evaluate(function () {
                return document.body.querySelector('.symbolSummary .pending') === null;
            });
        }, function () {
            var i,
                exitCode;

            exitCode = page.evaluate(function () {
                var list = document.body.querySelectorAll('.results > #details > .specDetail.failed'),
                    el,
                    desc,
                    msg,
                    ret;

                console.log(document.body.querySelector('.description').innerText);
                if (list && list.length > 0) {
                    console.log('');
                    console.log(list.length + ' test(s) FAILED:');
                    for (i = 0; i < list.length; i += 1) {
                        el = list[i];
                        desc = el.querySelector('.description');
                        msg = el.querySelector('.resultMessage.fail');

                        console.log('');
                        console.log(desc.innerText);
                        console.log(msg.innerText);
                        console.log('');
                    }
                    ret = 1;
                } else {
                    console.log(document.body.querySelector('.alert > .passingAlert.bar').innerText);
                    ret = 0;
                }

                return ret;
            });
            phantom.exit(exitCode);
        });
    }
});
