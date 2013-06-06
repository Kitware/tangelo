$(function () {
    d3.select("#myapp-content")
        .html("Hello from <strong>myapp.js!</strong>");

    d3.text("myservice", function (err, text) {
        d3.select("#service-content")
            .html(text);
    });
});
