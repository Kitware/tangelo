// Export a global module.
window.tangelo = {};

(function (tangelo) {
    "use strict";

    // Tangelo version number.
    tangelo.version = function () {
        var version = "0.10.0";
        return version;
    };

    // A namespace for plugins.
    tangelo.plugin = {};

    // Create a plugin namespace if it does not exist; otherwise, do nothing.
    tangelo.ensurePlugin = function (plugin) {
        if (tangelo.plugin[plugin] === undefined) {
            tangelo.plugin[plugin] = {};
        }
    };

    // Standard way to access a plugin namespace.
    tangelo.getPlugin = function (plugin) {
        if (tangelo.plugin[plugin] === undefined) {
            tangelo.plugin[plugin] = {};
        }

        return tangelo.plugin[plugin];
    };
}(window.tangelo));
