/*jslint browser: true */
/*globals $, tangelo, d3 */

var count = 1;

function addRow() {
    "use strict";

    d3.select("div.container")
        .append("div")
        .classed("row", true)
        .text("Additional row #" + count);
    count += 1;
}

$(function () {
    "use strict";

    // Create control panel.
    $("#control-panel").controlPanel();

    // Activate row-adding button.
    d3.select("#addrow")
        .on("click", addRow);

    // Measure and display the height of the control panel.
    d3.select("#before")
        .text($("#control-panel").height());

    // Add a row to the control panel.
    addRow();

    // Close the control panel.
    window.setTimeout(function () {
        $("[id^='tangelo-drawer-handle']")
            .trigger("click");

        window.setTimeout(function () {
            // One second later, open it again.
            $("[id^='tangelo-drawer-handle']")
                .trigger("click");

            window.setTimeout(function () {
                // Measure the height of the control panel now - it should be larger
                // than it was.
                d3.select("#after")
                    .text($("#control-panel").height());
            }, 600);
        }, 600);
    }, 100);
});
