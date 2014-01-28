/*jslint browser: true, nomen: true */

/*globals $, tangelo, d3, vg, console */

$(function () {
    "use strict";

    // Create control panel.
    $("#control-panel").controlPanel();

    // Make the body element the correct size for no scrolling
    d3.select("body").style("height", $(window).height() - 60);

    function init(data, host) {
        var view,
            donorMap = {},
            date,
            charity = null,
            charityMaxMonth = 10000000,
            dates,
            numFormat = d3.format("02d"),
            playing,
            timerId,
            time,
            i,
            d,
            normalize = false;

        function updateData() {
            // Load aggregated amount into donors array
            for (i = 0; i < data.donors.length; i += 1) {
                d = data.donors[i];
                if (normalize) {
                    d[1] = d[2] === 0 ? 0 : (d[3] / d[2]);
                } else {
                    d[1] = d[3];
                }
            }

            // Update the visualization
            view.data(data).update();
        }

        function updateDate() {
            var minDate,
                maxDate,
                url,
                next,
                d;

            // Construct query url with date range
            minDate = date.year + "-" + numFormat(date.month) + "-01";
            next = {year: date.year, month: date.month + 1};
            if (next.month > 12) {
                next.year += 1;
                next.month = 1;
            }
            maxDate = next.year + "-" + numFormat(next.month) + "-01";
            url = "charitynet/" + host + "/xdata/transactions?datemin=" + minDate + "&datemax=" + maxDate;
            if (charity !== null) {
                url += "&charity=" + charity[0];
            }

            // Update the donor data
            d3.json(url, function (error, donors) {
                var i;

                // Zero out data
                for (i = 0; i < data.donors.length; i += 1) {
                    data.donors[i][3] = 0;
                }

                // Load aggregated amount into donors array
                for (i = 0; i < donors.length; i += 1) {
                    d = donorMap[donors[i][0]];
                    if (d !== undefined) {
                        d[3] = donors[i][1];
                    }
                }

                updateData();
            });
        }

        function updater() {
            var time = d3.select("#time").node();
            time.selectedIndex = (time.selectedIndex + 1) % dates.length;
            date = dates[time.selectedIndex];
            updateDate();
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
            d3.select("#play span").classed("glyphicon-play", true).classed("glyphicon-pause", false);
            clearTimeout(timerId);
            var time = d3.select("#time").node();
            date = dates[time.selectedIndex];
            updateDate();
        });

        d3.select("#play").on("click", function () {
            playing = !playing;
            d3.select("#play span").classed("glyphicon-pause", playing).classed("glyphicon-play", !playing);
            if (playing) {
                timerId = setInterval(updater, 5000);
            } else {
                clearTimeout(timerId);
            }
        });

        d3.select("#popnorm").on("click", function () {
            normalize = this.checked;
            view._model._defs.marks.scales[0].domain = [0, normalize ? (charityMaxMonth / 5000000) : charityMaxMonth];
            updateData();
        });

        d3.select("#charity").selectAll("option")
            .data(data.charities)
            .enter().append("option")
            .attr("value", function (d) { return d[0]; })
            .text(function (d) { return d[1]; });

        d3.select("#charity").on("change", function () {
            var url;
            charity = data.charities[this.selectedIndex];
            url = "charitynet/" + host + "/xdata/transactions?by=month&charity=" + charity[0];
            d3.json(url, function (error, months) {
                console.log(months);
                charityMaxMonth = d3.max(months, function (d) { return d[1]; }) / 100;
                console.log(charityMaxMonth);
                view._model._defs.marks.scales[0].domain = [0, normalize ? (charityMaxMonth / 5000000) : charityMaxMonth];
                updateDate();
            });
        });

        // Init donors array and create map for looking up donors by county
        data.donors = [];
        for (i = 0; i < data.counties.length; i += 1) {
            d = [data.counties[i].id, 0, 0, 0];
            data.donors.push(d);
            donorMap[d[0]] = d;
        }

        // Attach population for each county
        for (i = 0; i < data.population.length; i += 1) {
            d = data.population[i];
            if (donorMap[d[0]] !== undefined) {
                donorMap[d[0]][2] = d[1];
            }
        }

        // Generate the visualization
        vg.parse.spec("choropleth.json", function (chart) {
            var padding = {};
            padding.top = ($(window).height() - 60 - 500) / 2;
            padding.left = ($(window).width() - 960) / 2;
            padding.bottom = padding.top;
            padding.right = padding.left;

            view = chart({el: "#vis", data: data}).width(960).height(500).padding(padding).update();

            time = d3.select("#time").node();
            date = dates[time.selectedIndex];
            updateDate();
            if (playing) {
                timerId = setInterval(updater, 2000);
            }
        });
    }

    // Load in the default configuration values, county, state, and initial
    // contribution data
    tangelo.defaults("defaults.json", function (defaults) {
        var host;

        host = defaults.host || "mongo";

        d3.json("us-counties.json", function (error, counties) {
            d3.json("us-states.json", function (error, states) {
                d3.json("charitynet/" + host + "/xdata/population", function (error, population) {
                    d3.json("charitynet/" + host + "/xdata/charities", function (error, charities) {
                        var i, d, data = {};

                        // Generate data object
                        data.counties = counties.features;
                        data.states = states.features;
                        data.population = population;
                        data.charities = charities;

                        init(data, host);
                    });
                });
            });
        });
    });
});
