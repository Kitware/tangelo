(function ($) {
    $.fn.navbar = function () {
        var footer,
            navbar_inner,
            modal,
            oktext,
            selection,
            type,
            ul,
            x,
            s;

        // Create a d3 selection out of the target element.
        s = d3.select(this[0]);

        // Bail out silently if the selection is empty.
        if (s.empty()) {
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
}(jQuery));
