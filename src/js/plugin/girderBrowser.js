/*jslint browser: true */

(function ($, d3) {
    "use strict";

    if (!($ && d3)) {
        return;
    }

    $.fn.girderBrowser = function () {
        var me,
            menu,
            item,
            i;

        // Make a d3 selection out of the target element.
        me = d3.select(this[0]);

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
