/*jslint browser: true */

/*global $, d3 */

/**
 *
 * @fileOverview Defines the global namespace <i>tangelo</i> and provides a
 * top-level utilities.
 */

/**
 * @namespace The global namespace for all XDATA Web javascript utilities.
 */
var tangelo = {};

(function () {
    "use strict";

    /** Creates namespaces nested within <i>tangelo</i> as appropriate.
     *
     * @param {string} ns_spec A string describing a namespace path, like
     * "utilities.UI".  This path of namespaces will be created by this
     * function, embedded implicitly within the <i>tangelo</i> namespace - i.e.,
     * <i>tangelo.utilities.UI</i> would be a valid namespace after running this
     * function.  If some of the namespaces in the path already exist, the
     * function will simply continue within those namespace containers as though
     * they had just been created by the function.
     *
     * @returns {namespace} The namespace container corresponding to
     * <i>ns_spec</i>.
     */
    tangelo.namespace = function (ns_spec) {
        var ns_path,
            mod,
            messageFunction,
            namingFunction,
            i,
            path_component;

        namingFunction = function (name) {
            return function () {
                return name;
            };
        };

        messageFunction = function (name) {
            return function (f, m) {
                return "[" + name + "." + f + "] " + m;
            };
        };

        ns_path = ns_spec.split(".");

        mod = tangelo;
        mod.name = namingFunction("tangelo");
        mod.message = messageFunction(mod.name());
        for (i = 0; i < ns_path.length; i += 1) {
            path_component = ns_path[i];

            mod[path_component] = mod[path_component] || {};
            mod = mod[path_component];
            mod.name = namingFunction("tangelo." + ns_path.slice(0, i + 1));
            mod.message = messageFunction(mod.name());
        }

        return mod;
    };

    // Initialization function that will handle tangelo-specific elements
    // automatically.
    $(function () {
        // Instantiate a navbar if there is an element marked as such.
        $("[data-tangelo-type=navbar]").navbar();

        // Instantiate a control panel if there is an element marked as such.
        $("[data-tangelo-type=control-panel]").controlPanel();
    });
}());
