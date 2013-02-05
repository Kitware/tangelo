/*jslint browser: true */

var xdw = {}; 

(function () {
    "use strict";

    xdw.namespace = function (ns_spec) {
        var ns_path,
            mod,
            i,
            path_component;

        ns_path = ns_spec.split(".");

        mod = xdw;
        for (i = 0; i < ns_path.length; i += 1) {
            path_component = ns_path[i];

            mod[path_component] = mod[path_component] || {};
            mod = mod[path_component];
        }

        return mod;
    };
}());
