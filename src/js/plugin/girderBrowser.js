/*jslint browser: true */

(function ($, d3) {
    "use strict";

    if (!($ && d3)) {
        return;
    }

    $.fn.girderBrowser = function (cfg) {
        var me,
            menu,
            item,
            i,
            caret,
            label;

        // Extract cfg args.
        cfg = cfg || {};
        caret = cfg.caret === undefined ? "true" : cfg.caret;
        label = (cfg.label || "") + (caret ? "<b class=caret></b>" : "");

        // Empty the target element and make a d3 selection from it.
        $(this[0]).empty();
        me = d3.select(this[0]);

        // Class the target element as a dropdown.
        me.classed("dropdown", true);

        // Add an anchor tag with the label text.
        me.append("a")
            .attr("href", "#")
            .attr("role", "button")
            .classed("dropdown-toggle", true)
            .attr("data-toggle", "dropdown")
            .html(label);

        // Add a few items to the element.
        menu = me.append("ul")
            .classed("dropdown-menu", true);

        item = menu.append("li")
            .classed("dropdown-submenu", true);

        item.append("a")
            .attr("href", "#")
            .text("Submenu");

        item = item.append("ul")
            .classed("dropdown-menu", true);

        for (i = 0; i < 3; i += 1) {
            item.append("li")
                .append("a")
                .attr("href", "#")
                .text("Link " + i);
        }

        menu.append("li")
            .append("a")
            .attr("href", "#")
            .text("Second top-level link");

        menu.append("li")
            .append("a")
            .attr("href", "#")
            .text("Third top-level link");

        // Make the element into a Bootstrap dropdown.
        $(me.select("a").node()).dropdown();
    };

}(window.jQuery, window.d3));
