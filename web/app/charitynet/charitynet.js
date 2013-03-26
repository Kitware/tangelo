/*jslint browser: true */

/*globals $, tangelo, d3, vg, console */

$(function () {
    "use strict";

    // Make the body element the correct size for no scrolling
    d3.select("body").style("height", $(window).height() - 60);

    function init(data) {
        var view,
            donorMap = {},
            date,
            dates,
            numFormat = d3.format("02d"),
            playing,
            timerId,
            time,
            i,
            d;

        function updateDate(date) {
            var minDate,
                maxDate,
                url,
                next;

            // Construct query url with date range
            minDate = date.year + "-" + numFormat(date.month) + "-01";
            next = {year: date.year, month: date.month + 1};
            if (next.month > 12) {
                next.year += 1;
                next.month = 1;
            }
            maxDate = next.year + "-" + numFormat(next.month) + "-01";
            url = "/service/charitynet/mongo/xdata/bydate?datemin=" + minDate + "&datemax=" + maxDate;

            // Update the donor data
            d3.json(url, function (error, donors) {
                var i;

                // Zero out data (keep positive in case we are using log scale).
                for (i = 0; i < data.donors.length; i += 1) {
                    data.donors[i][1] = 0.01;
                }

                // Load aggregated amount into donors array
                for (i = 0; i < donors.length; i += 1) {
                    if (donorMap[donors[i][0]] !== undefined) {
                        donorMap[donors[i][0]][1] = donors[i][1];
                    }
                }

                // Update the visualization
                view.data(data).update(1000);
            });
        }

        function updater() {
            var time = d3.select("#time").node();
            time.selectedIndex = (time.selectedIndex + 1) % dates.length;
            updateDate(dates[time.selectedIndex]);
        }

        date = {year: 2011, month: 1};
        dates = [];
        while (date.year * 100 + date.month <= 201301) {
            dates.push({year: date.year, month: date.month});
            date.month += 1;
            if (date.month > 12) {
                date.year += 1;
                date.month = 1;
            }
        }

        playing = true;

        d3.select("#time").selectAll("option")
            .data(dates)
            .enter().append("option")
            .attr("value", function (d) { return d; })
            .text(function (d) { return d.year + "-" + numFormat(d.month); });

        d3.select("#time").on("change", function () {
            playing = false;
            d3.select("#play i").classed("icon-play", true).classed("icon-pause", false);
            clearTimeout(timerId);
            var time = d3.select("#time").node();
            updateDate(dates[time.selectedIndex]);
        });

        d3.select("#play").on("click", function () {
            playing = !playing;
            d3.select("#play i").classed("icon-pause", playing).classed("icon-play", !playing);
            if (playing) {
                timerId = setInterval(updater, 5000);
            } else {
                clearTimeout(timerId);
            }
        });

        // Create map for looking up donors by county
        for (i = 0; i < data.donors.length; i += 1) {
            donorMap[data.donors[i][0]] = data.donors[i];
        }

        // Fill in missing counties
        for (i = 0; i < data.counties.length; i += 1) {
            if (donorMap[data.counties[i].id] === undefined) {
                d = [data.counties[i].id, 0.01];
                data.donors.push(d);
                donorMap[d[0]] = d;
            }
        }

        // Generate the visualization
        vg.parse.spec("choropleth.json", function (chart) {
            var padding = {};

            padding.top = ($(window).height() - 60 - 500) / 2;
            padding.left = ($(window).width() - 960) / 2;
            padding.bottom = padding.top;
            padding.right = padding.left;
            view = chart("#vis", data).width(960).height(500).padding(padding).update();

            time = d3.select("#time").node();
            updateDate(dates[time.selectedIndex]);
            if (playing) {
                timerId = setInterval(updater, 5000);
            }
        });
    }

    // Load in the county, state, and initial contribution data
    d3.json("us-counties.json", function (error, counties) {
        d3.json("us-states.json", function (error, states) {
            d3.json("/service/charitynet/mongo/xdata/bydate", function (error, donors) {
                var i, d, data = {};

                // Generate data object
                data.counties = counties.features;
                data.states = states.features;
                data.donors = donors;

                init(data);
            });
        });
    });
});
