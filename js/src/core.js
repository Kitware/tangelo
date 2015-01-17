// Export a global module.
window.tangelo = {};

(function (tangelo) {
    "use strict";

    // Tangelo version number.
    tangelo.version = function () {
        var version = "0.8.1-dev";
        return version;
    };

    // A namespace for plugins.
    tangelo.plugin = {};

    // Standard way to access a plugin namespace.
    tangelo.getPlugin = function (plugin) {
        if (tangelo.plugin[plugin] === undefined) {
            tangelo.plugin[plugin] = {};
        }

        return tangelo.plugin[plugin];
    };
}(window.tangelo));
