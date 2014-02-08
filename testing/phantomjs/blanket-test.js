// This is a script for PhantomJS to run.  It retrieves the coverage testing
// webpage and parses out the percentage coverage from it.  This script will
// drive the actual test case for JS coverage.

var system = require('system');

/**
 * Wait until the test condition is true or a timeout occurs. Useful for waiting
 * on a server response or for a ui change (fadeIn, etc.) to occur.
 *
 * @param testFx javascript condition that evaluates to a boolean,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param onReady what to do when testFx condition is fulfilled,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
 */
function waitFor(testFx, onReady, timeOutMillis) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3001, //< Default Max Timeout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    console.log("'waitFor()' timeout");
                    phantom.exit(1);
                } else {
                    // Condition fulfilled (timeout and/or condition is 'true')
                    //console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
                    typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
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

// Route "console.log()" calls from within the Page context to the main Phantom context (i.e. current "this")
page.onConsoleMessage = function(msg) {
    console.log(msg);
};

page.open(url, function(status){
    if (status !== "success") {
        console.log("Unable to access network");
        phantom.exit(1);
    } else {
        waitFor(function(){
            return page.evaluate(function(){
                return document.body.querySelector('#blanket-main') !== null;
            });
        }, function(){
            var pct = page.evaluate(function(){
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

            if (pct === null) {
                phantom.exit(1);
            } else {
                console.log("coverage is " + pct + "%, threshold for passing is " + threshold + "%");
                phantom.exit(pct < threshold);
            }
        });
    }
});
