/*jslint browser: true */

// Grab the script tag this script is contained in.
var scripts = document.getElementsByTagName("script");
var point = scripts[scripts.length - 1];

// A convenience function to insert new script tags directly after this one (for
// the user's ease).
var insertAfter = function (referenceNode, newNode) {
    "use strict";
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
};

// A function to retrieve the script text *synchronously* using XHR.
var newScript = function (src) {
    "use strict";
    document.write('<script src="' + src + '"></script>');
};

// Load the dependencies of Tangelo, followed by Tangelo itself.
newScript("/js/lib/jquery-1.8.2.min.js");
newScript("/js/lib/d3.v3.min.js");
newScript("/js/lib/bootstrap.js");
newScript("/js/tangelo.min.js");

// Clean up after ourselves.
//
// "Strike hard, and fade away without a trace." --Master Splinter
delete window.scripts;
delete window.point;
delete window.insertAfter;
delete window.newScript;
