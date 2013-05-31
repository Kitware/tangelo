/*jslint browser: true */

/*global d3, console, tangelo */

window.onload = function () {
    "use strict";

    tangelo.util.landingPage({
        specFile: "apps.json",
        appLeftSelector: "#left",
        appRightSelector: "#right",
        extLeftSelector: "#external-left",
        extRightSelector: "#external-right"
    });
};
