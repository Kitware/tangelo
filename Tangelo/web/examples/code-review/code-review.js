/*jslint browser: true, unparam: true */

/*globals d3, console */

(function () {
    "use strict";

    var margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = 1000 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom,
        fullData,
        nameFilter = "",
        nameInverse = false,
        authorFilter = "",
        authorInverse = false;

    var x = d3.scale.ordinal()
        .rangeBands([0, width], 0.1);

    var y = d3.scale.linear()
        .range([height, 0]);

    var color = d3.scale.category20();

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    function update(data) {
        x.domain(data.map(function(d, i) { return i; }));
        y.domain([0.1, d3.max(data, function(d) { return d.change_count; })]);

        svg.selectAll("*").remove();

        //svg.append("g")
        //    .attr("class", "x axis")
        //    .attr("transform", "translate(0," + height + ")")
        //    .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Commits in topic");

        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .style("fill", function (d) {return color(d.author); })
            .attr("x", function(d, i) { return x(i); })
            .attr("width", x.rangeBand())
            .attr("y", function(d) { return y(d.change_count); })
            .attr("height", function(d) { return height - y(d.change_count); })
            .on("mouseover", function (d) {
                d3.select(this).style("fill", "black");
                d3.select(this).style("cursor", "hand");
            })
            .on("mouseout", function (d) {
                d3.select(this).style("fill", color(d.author));
                d3.select(this).style("cursor", "");
            })
            .on("click", function (d) {
                window.open("http://review.source.kitware.com/#/t/" + d.topic_id + "/", "_blank");
            })
            .append("title")
            .text(function (d) { return d.author + ", " + d.topic_name + ", " + d.change_count + " commits"; });
    }

    function refilter() {
        var data = [];
        fullData.forEach(function (d) {
            if ((nameFilter === "" || d.topic_name.indexOf(nameFilter) !== -1) && (!authorInverse ^ !(authorFilter === "" || d.author.indexOf(authorFilter) !== -1))) {
                data.push(d);
            }
        });
        update(data);
    }

    d3.select("#name-filter").on("keyup", function (d) {
        nameFilter = this.value;
        refilter();
    });

    d3.select("#author-filter").on("keyup", function (d) {
        authorFilter = this.value;
        authorInverse = authorFilter.indexOf("!") === 0;
        if (authorInverse) {
            authorFilter = authorFilter.slice(1);
        }
        refilter();
    });

    d3.tsv("topics.txt", function (error, data) {
        data.forEach(function (d) {
            d.change_count = +d.change_count;
        });
        fullData = data;
        update(data);
    });
}());
