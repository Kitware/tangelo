/*jslint browser: true */
/*globals phantom, $ */

// Parse command line arguments.
var system = require("system");
var url = system.args[1];
var build_dir = system.args[2];

if (!url || !build_dir) {
    console.error("usage: blanket-gcov.js <url> <build-dir>");
    phantom.exit(1);
}

// Filesystem utilities.
var fs = require("fs");

// Get a page handle.
var page = require("webpage").create();

// Open the target URL.
page.open(url, function (status) {
    "use strict";

    var startTime,
        timeout = 10000,
        i;

    if (status !== "success") {
        console.log("Could not retrieve URL (" + url + ")");
        phantom.exit(1);
    }

    startTime = new Date().getTime();
    setInterval(function () {
        page.includeJs("http://code.jquery.com/jquery-1.8.2.min.js", function () {
            var now = new Date().getTime(),
                preamble,
                fileOutput = "",
                report,
                count,
                line_no,
                line,
                deficit,
                j;

            // Time out if needed.
            if (now - startTime > timeout) {
                console.log("Page load timed out.");
                phantom.exit(1);
            }

            // Look for a div element bearing the class "bl-source" - this is the
            // actual coverage report.
            report = page.evaluate(function () {
                var elem = $("div.bl-source").get(0),
                    i,
                    div,
                    hits = 0,
                    lines = 0,
                    annotation = [],
                    count;

                if (!elem) {
                    console.log("no");
                    return undefined;
                }

                for (i = 0; i < elem.children.length; i += 1) {
                    div = $(elem.children[i]);

                    if (div.attr("class") === "hit") {
                        hits += 1;
                        lines += 1;

                        count = "1";
                    } else if (div.attr("class") === "miss") {
                        lines += 1;

                        count = "-";
                    } else {
                        count = "#####";
                    }

                    annotation.push({
                        count: count,
                        line: div.text(),
                        line_no: JSON.stringify(i + 1)
                    });
                }

                return {
                    hits: hits,
                    lines: lines,
                    annotation: annotation
                };
            });

            // Bail out if the report is not ready yet.
            if (!report) {
                return;
            }

            // Process the report.
            for (i = 0; i < report.annotation.length; i += 1) {
                count = report.annotation[i].count;
                line_no = report.annotation[i].line_no;
                line = report.annotation[i].line;

                // Pad the count string to 9 places.
                deficit = count.length;
                for (j = 0; j < 9 - deficit; j += 1) {
                    count = " " + count;
                }

                // Strip the line number from the front of the code line.
                line = line.slice(line_no.length);

                // Pad the line number string to 5 places.
                deficit = line_no.length;
                for (j = 0; j < 5 - deficit; j += 1) {
                    line_no = " " + line_no;
                }

                fileOutput += count + ":" + line_no + ":" + line + "\n";
            }

            preamble = "        -:    0:Source:" + build_dir + "/tangelo/web/js/tangelo.js\n";
            preamble += "        -:    0:Graph:tangelo.js.gcno\n";
            preamble += "        -:    0:Data:tangelo.js.gcda\n";
            preamble += "        -:    0:Runs:1\n";
            preamble += "        -:    0:Programs:1\n";

            fs.write("tangelo.js.gcov", preamble + fileOutput, "w");

            console.log("File '" + build_dir + "/tangelo/web/js/tangelo.js'");
            console.log("Lines executed:" + (report.hits * 100 / report.lines).toFixed(2) + "% of " + report.lines);
            console.log("Creating 'tangelo.js.gcov'");

            phantom.exit(0);
        });
    }, 1000);
});
