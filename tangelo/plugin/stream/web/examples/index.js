$(function () {
    "use strict";

    var redprime,
        blueprime,
        running = true,
        delay = 10,
        tablerow,
        other = blueprime,
        count = 0,
        key;

    tablerow = d3.select("#content")
        .append("tr");

    d3.select("#pause")
        .on("click", function () {
            var text;

            running = !running;
            text = running ? "Stop" : "Resume";

            d3.select(this)
                .text(text);

            if (running) {
                tangelo.plugin.stream.run(key, other);
            } else {
                delay = 10;
            }
        });

    redprime = function (value) {
        tablerow.append("td")
            .style("background-color", "#de5d5d")
            .text(value);

        if (count++ === 10) {
            tablerow = d3.select("#content")
                .append("tr");
            count = 0;
        }

        if (delay < 500) {
            delay *= 1.1;
        }

        other = blueprime;

        return {
            callback: blueprime,
            delay: delay,
            continue: running
        };
    };

    blueprime = function (value) {
        tablerow.append("td")
            .style("background-color", "#90ade0")
            .text(value);

        if (count++ === 10) {
            tablerow = d3.select("#content")
                .append("tr");
            count = 0;
        }

        if (delay < 1000) {
            delay *= 2;
        }

        other = redprime;

        return {
            callback: redprime,
            delay: delay,
            continue: running
        };
    };

    tangelo.plugin.stream.start("primes", function (stream_key) {
        key = stream_key;
        tangelo.plugin.stream.run(key, redprime);
    });
});
