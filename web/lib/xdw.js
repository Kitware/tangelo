/*jslint browser: true */

/**
 *
 * @fileOverview Defines the global namespace <i>xdw</i> and provides a
 * top-level utilities.
 */

/**
 * @namespace The global namespace for all XDATA Web javascript utilities.
 */
var xdw = {};

(function () {
    "use strict";

    /** Creates namespaces nested within <i>xdw</i> as appropriate.
     *
     * @param {string} ns_spec A string describing a namespace path, like
     * "utilities.UI".  This path of namespaces will be created by this
     * function, embedded implicitly within the <i>xdw</i> namespace - i.e.,
     * <i>xdw.utilities.UI</i> would be a valid namespace after running this
     * function.  If some of the namespaces in the path already exist, the
     * function will simply continue within those namespace containers as though
     * they had just been created by the function.
     *
     * @returns {namespace} The namespace container corresponding to
     * <i>ns_spec</i>.
     */
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
