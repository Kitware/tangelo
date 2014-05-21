/*jslint browser: true */
/*globals declareTest, compareImages, toImageData */

declareTest({
    name: "NER service, example sentence - correctness",
    url: "/examples/ner/ner?text=Toto, I've a feeling we're not in Kansas anymore.",
    test: function () {
        "use strict";

        var actual = document.body.textContent,
            expected = JSON.stringify({
                result: [
                    ["GPE", "Toto"],
                    ["GPE", "Kansas"]
                ]
            }).replace(/:/g, ": ")
                .replace(/,/g, ", ");

        console.log("expected: " + expected);
        console.log("received: " + actual);

        return actual === expected;
    }
});
