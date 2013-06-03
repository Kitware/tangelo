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
        var brand,
            i,
            initialize_control_panel,
            initialize_navbar,
            item,
            items;

        // Callback specifier for clicking the "save config" button in the
        // standard tangelo config panel.
        tangelo.onConfigSave = function (callback) {
            d3.select("#tangelo-config-submit")
                .on("click.tangelo", callback);
        };

        // Callback specifier for bringing up the tangelo config panel (e.g. by
        // clicking on the navbar item).
        tangelo.onConfigLoad = function (callback) {
            $("#tangelo-config-panel").on("show.tangelo", callback);
        };

        // Callback specifier for clicking the "defaults" button in the standard
        // tangelo config panel.
        tangelo.onConfigDefault = function (callback) {
            d3.select("#tangelo-config-defaults")
                .on("click.tangelo", callback);
        };

        // Create bootstrap-styled navbar at top of screen.
        initialize_navbar = function (s) {
            var footer,
                navbar_inner,
                modal,
                oktext,
                selection,
                type,
                ul,
                x;

            // Bail out if the selection is empty.
            if (s.empty()) {
                console.log("initialize_navbar: input selection was empty!");
                return;
            }

            // Convert the top-level element into a bootstrap navbar element,
            // then embed a "navbar-inner" div within it.
            navbar_inner = s.classed("navbar", true)
                .classed("navbar-fixed-top", true)
                .append("div")
                    .classed("navbar-inner", true);

            // Create a "brand" item if requested.
            brand = s.attr("data-tangelo-brand");
            if (brand !== null) {
                navbar_inner.append("a")
                    .classed("brand", true)
                    .attr("href", s.attr("data-tangelo-brand-href"))
                    .text(brand);
            }

            // Create an unordered list for holding the navbar contents.
            ul = navbar_inner.append("ul")
                    .classed("nav", true);

            // Create an app name item if requested.
            if (s.attr("data-tangelo-app") !== null) {
                ul.append("li")
                    .classed("active", true)
                    .append("a")
                        .text(s.attr("data-tangelo-app"));
            }

            // Each top-level div inside the navbar div represents list-item
            // content for the navbar.  One by one, handle them as necessary and
            // add an appropriate li to the list.
            //
            // Start by forming an array of single-element selections out of the
            // full list.
            items = s.selectAll("[data-tangelo-type]")[0].map(d3.select);

            // Go through and check the type field, taking approriate action for
            // each.
            for (i = 0; i < items.length; i += 1) {
                item = items[i];
                type = item.attr("data-tangelo-type");

                if (type === "info") {
                    ul.append("li")
                        .append("a")
                        .classed("pointer", true)
                        .attr("data-toggle", "modal")
                        .attr("data-target", "#tangelo-info-panel")
                        .html("<i class=icon-info-sign></i> Info");

                    modal = d3.select(document.body)
                        .insert("div", ":first-child")
                        .attr("id", "tangelo-info-panel")
                        .classed("modal", true)
                        .classed("hide", true)
                        .classed("fade", true);

                    x = modal.append("div")
                        .classed("modal-header", true);
                    x.append("button")
                        .attr("type", "button")
                        .classed("close", true)
                        .attr("data-dismiss", "modal")
                        .attr("aria-hidden", true)
                        .html("&times;");
                    x.append("h3")
                        .text("Information");

                    modal.append("div")
                        .classed("modal-body", true)
                        .html(item.html());

                    oktext = item.attr("data-tangelo-ok-button") || "";
                    modal.append("div")
                        .classed("modal-footer", true)
                        .append("a")
                            .classed("btn", true)
                            .attr("data-dismiss", "modal")
                            .text(oktext === "" ? "OK" : oktext);

                    item.remove();

                } else if (type === "config") {
                    ul.append("li")
                        .append("a")
                        .classed("pointer", true)
                        .attr("data-toggle", "modal")
                        .attr("data-target", "#tangelo-config-panel")
                        .html("<i class=icon-cog></i> Config");

                    modal = d3.select(document.body)
                        .insert("div", ":first-child")
                        .attr("id", "tangelo-config-panel")
                        .classed("modal", true)
                        .classed("hide", true)
                        .classed("fade", true);

                    x = modal.append("div")
                        .classed("modal-header", true);
                    x.append("button")
                        .attr("type", "button")
                        .classed("close", true)
                        .attr("data-dismiss", "modal")
                        .attr("aria-hidden", true)
                        .html("&times;");
                    x.append("h3")
                        .text("Configuration");

                    modal.append("div")
                        .classed("modal-body", true)
                        .html(item.html());

                    oktext = item.attr("data-tangelo-cancel-button") || "";
                    footer = modal.append("div")
                        .classed("modal-footer", true);
                    footer.append("a")
                        .attr("id", "tangelo-config-cancel")
                        .classed("btn", true)
                        .attr("data-dismiss", "modal")
                        .text(oktext === "" ? "Cancel" : oktext);
                    footer.append("a")
                        .attr("id", "tangelo-config-defaults")
                        .classed("btn", true)
                        .text("Defaults");
                    footer.append("a")
                        .attr("id", "tangelo-config-submit")
                        .classed("btn", true)
                        .classed("btn-primary", true)
                        .attr("data-dismiss", "modal")
                        .text(oktext === "" ? "Save changes" : oktext);

                    item.remove();
                } else if (type === "other") {
                    // TODO(choudhury): implement this code path.
                    throw "navbar item type 'other' currently unimplemented";
                } else {
                    throw "unknown navbar item type '" + type + "'";
                }
            }
        };

        initialize_navbar(d3.select("[data-tangelo-type=navbar]"));

        // Instantiate a control panel if there is an element marked as such.
        $("[data-tangelo-type=control-panel]").controlPanel();
    });
}());
