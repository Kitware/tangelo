suite("NER service, example sentence", "http://localhost:8080/examples/ner/ner?text=Toto, I've a feeling we're not in Kansas anymore.", function () {
    test("correctness", function (page) {
        var expected = JSON.stringify({
            result: [
                ["GPE", "Toto"],
                ["GPE", "Kansas"]
            ]
        })
            .replace(/:/g, ": ")
            .replace(/,/g, ", ");

        console.log("expected: " + expected);
        console.log("received: " + page.plainText);

        return page.plainText === expected;
    });
});
