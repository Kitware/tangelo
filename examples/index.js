/*jslint browser: true */

/*global tangelo, $ */

window.onload = function () {
    "use strict";

    tangelo.requireCompatibleVersion("0.2");

    $(document.body).landingPage({
        specFile: "apps.json",
        appLeftSelector: "#left",
        appRightSelector: "#right",
        extLeftSelector: "#external-left",
        extRightSelector: "#external-right"
    });
};
