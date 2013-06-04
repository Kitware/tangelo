/*global $ */

// Export a global module.
var tangelo = {};

(function () {
    "use strict";

    // Initialization function that will handle tangelo-specific elements
    // automatically.
    $(function () {
        // Instantiate a navbar if there is an element marked as such.
        $("[data-tangelo-type=navbar]").navbar();

        // Instantiate a control panel if there is an element marked as such.
        $("[data-tangelo-type=control-panel]").controlPanel();
    });
}());
