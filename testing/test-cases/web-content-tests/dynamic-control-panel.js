/*jslint browser: true */
/*globals declareTest, compareImages, toImageData, Promise */

declareTest({
    name: "Control panel size should increase when rows are added to it",
    url: "/tests/cases/dynamic-control-panel",
    delay: 1500,
    test: function () {
        "use strict";

        var before,
            after;

        before = document.getElementById("before").innerText;
        after = document.getElementById("after").innerText;

        console.log("expected control panel to grow from 40px to 60px");
        console.log("before: " + before);
        console.log("after: " + after);

        return before === "40" && after === "60";
    }
});
