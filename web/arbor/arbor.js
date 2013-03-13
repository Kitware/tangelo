/*jslint browser: true */

/*global d3, console */

window.onload = function () {
    "use strict";

    xdw.util.landingPage({
        specFile: "arbor-apps.json",
        appLeftSelector: "#left",
        appRightSelector: "#right",
        extLeftSelector: "#external-left",
        extRightSelector: "#external-right"
    });
};
