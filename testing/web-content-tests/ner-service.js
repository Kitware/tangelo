declareTest({
    name: "NER service, example sentence - correctness",
    url: "http://localhost:8080/examples/ner/ner?text=Toto, I've a feeling we're not in Kansas anymore.",
    test: function (page) {
        var expected = JSON.stringify({
            result: [
                ["GPE", "Toto"],
                ["GPE", "Kansas"]
            ]
        }).replace(/:/g, ": ")
            .replace(/,/g, ", ");

        console.log("expected: " + expected);
        console.log("received: " + page.plainText);

        return page.plainText === expected;
    }
});
