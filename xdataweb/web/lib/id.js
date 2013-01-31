/* jslint */

// ID generator for different objects in use at the same time.

// Global namespace.
var ID = {};

ID.next = (function () {
    "use strict";

    var counter = 0;

    return function () {
        var id;

        id = "id" + counter;
        counter = counter + 1;

        return id;
    };
}());
