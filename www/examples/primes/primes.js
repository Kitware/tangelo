/*jslint browser: true */

/*globals $, tangelo, d3 */

$(function () {
    "use strict";

    var values = [];

    tangelo.stream.start("primes", function (primes_key) {
        var offset = 0;

        function totalWidth(el) {
            return $(el).width() + (+$(el).css("marginLeft").slice(0, -2)) + (+$(el).css("marginRight").slice(0, -2));
        }

        tangelo.stream.run(primes_key, function (results) {
            var sel,
                shift;

            values.push(results);
            if (values.length > 5) {
                values = values.slice(1);
            }

            sel = d3.select("#primes")
                .selectAll("div")
                .data(values, function (d) {
                    return d;
                });

            sel.exit()
                .each(function () {
                    shift = totalWidth(this);
                });

            if (shift === undefined) {
                shift = 0;
            }

            sel.enter()
                .append("div")
                .classed("card", true)
                .style("left", offset + "px")
                .text(results)
                .each(function () {
                    offset += totalWidth(this);
                });

            sel.transition()
                .duration(500)
                .style("left", function () {
                    var val = (+d3.select(this).style("left").slice(0, -2) - shift) + "px";
                    //console.log(val);
                    return val;
                });

            sel.exit()
                .transition()
                .duration(500)
                .style("left", function () {
                    return (+d3.select(this).style("left").slice(0, -2) - shift) + "px";
                })
                .remove();

            offset -= shift;
        }, 1000);
    });
});
