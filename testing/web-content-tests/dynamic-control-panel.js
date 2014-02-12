/*jslint browser: true */
/*globals declareTest, compareImages, toImageData, Promise */

declareTest({
    name: "Control panel size should increase when rows are added to it",
    url: "/tests/cases/dynamic-control-panel",
    test: function (page) {
        "use strict";

        return new Promise(function (deliver) {
            var before,
                after;

            window.setTimeout(function () {
                before = page.evaluate(function () {
                    return document.getElementById("before").innerText;
                });

                after = page.evaluate(function () {
                    return document.getElementById("after").innerText;
                });

                console.log("expected control panel to grow from 40px to 60px");
                console.log("before: " + before);
                console.log("after: " + after);

                deliver(before === "40" && after === "60");
            }, 1500);
        });
    }
});
