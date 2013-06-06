/*jslint browser: true */

/*global d3, console, tangelo */

window.onload = function () {
    "use strict";

    $(document.body).landingPage({
        specFile: "apps.json",
        appLeftSelector: "#left",
        appRightSelector: "#right",
        extLeftSelector: "#external-left",
        extRightSelector: "#external-right"
    });
};
