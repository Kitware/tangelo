// Export a global module.
window.tangelo = {};

(function (tangelo) {
    "use strict";

    // Tangelo version number.
    tangelo.version = function () {
        var version = "0.7.0-dev";
        return version;
    };

    // The root url for Tangelo plugins.
    tangelo.pluginRoot = "/plugin";

    // A namespace for plugins.
    tangelo.plugin = {};
}(window.tangelo));
