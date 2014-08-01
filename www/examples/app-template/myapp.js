/*jslint browser: true */

/*globals $, tangelo, d3 */

$(function () {
    "use strict";

    // Create control panel.
    $("#control-panel").controlPanel();

    d3.select("#myapp-content")
        .html("Hello from <strong>myapp.js!</strong>");

    /*jslint unparam: true */
    d3.text("myservice", function (err, text) {
        d3.select("#service-content")
            .html(text);
    });
    /*jslint unparam: false */
});
