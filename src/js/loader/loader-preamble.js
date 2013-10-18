/*jslint browser: true */

// Create a "tangelo" namespace object - we'll put all of the loader variables
// here, and when tangelo is actually loaded, its definition of this same global
// name will blow away everything we have put in it, avoiding the need to
// explicitly clean up after ourselves.
var tangelo = {};

// A convenience function to insert new script tags directly after this one (for
// the user's ease).
tangelo.insertAfter = function (referenceNode, newNode) {
    "use strict";
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
};

// A function to retrieve the script text *synchronously* using XHR.
tangelo.newScript = function (src, attrs) {
    "use strict";

    var attrstring = [],
        k;

    attrs = attrs || {};
    for (k in attrs) {
        attrstring = attrstring.concat(k + '="' + attrs[k] + '"');
    }
    if (attrstring.length > 0) {
        attrstring = " " + attrstring.join(" ");
    }

    document.write('<script src="' + src + '"' + attrstring + '></script>');
};

tangelo.kill = function (x) {
    "use strict";
    x.parentNode.removeChild(x);
};

tangelo.whoami = function () {
    "use strict";
    return document.getElementsByTagName("script")[document.getElementsByTagName("script").length - 1];
};
