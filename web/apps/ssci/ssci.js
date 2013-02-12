/*jslint browser: true */

/*globals d3 */

"use strict";

var crosscatvis = function (spec) {
    var that,
        playing = spec.playing || true,
        index = spec.index || 0,
        dataUpdate = spec.dataUpdate,
        margin = spec.margin || {top: 200, right: 800, bottom: 200, left: 150},
        width = spec.width || 1500,
        height = spec.height || 400,
        x = d3.scale.ordinal().rangeBounds([0, width]),
        y = [d3.scale.ordinal().rangeBands([0, height])],
        color = d3.scale.category20().domain([1, 0]);

    that = {};
    return that;
};

var playing = true;
var timeValue = 0;
var animationLength = 1000;

var margin = {top: 200, right: 800, bottom: 200, left: 150},
    width = 1500,
    height = 400;

var x = d3.scale.ordinal().rangeBands([0, width]),
    y = [d3.scale.ordinal().rangeBands([0, height])],
    c = d3.scale.category20().domain([1, 0]);

var colPartition = [];
var rowPartition = [];
var firstColumnInView = [];
var rowPartitionReindex = [];

var svg = d3.select("#svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)

    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.json("ssci.json", function (data) {

    var column,
        mouseover,
        mouseout,
        cell,
        viewRows,
        updateRows,
        columnPosition,
        rowPosition,
        order,
        orderWrapper,
        cellOpacity;

    cellOpacity = function (d) {
        var opacity = 1;
        if (d.value === 0) {
            opacity = 0.5;
        }
        return opacity;
    }

    mouseover = function (p) {
        d3.selectAll(".row text.row-text").classed("active", function (d, i) { return d === data.rows[p.i]; });
        d3.selectAll(".column text").classed("active", function (d, i) { return i === p.j; });
        d3.selectAll(".cell").attr("opacity", function (d) {
            var opacity = cellOpacity(d);
            if (d.i !== p.i) {
                opacity *= 0.25;
            }
            return opacity;
        });
    };

    mouseout = function () {
        d3.selectAll("text").classed("active", false);
        d3.selectAll(".cell").classed("active", false);
        d3.selectAll(".cell").attr("opacity", cellOpacity);
    };

    updateRows = function () {
        var row = svg.selectAll(".row")
            .data(y.slice(1));
        row.enter().append("g")
            .attr("class", "row")
            .each(viewRows);
        row.each(viewRows);
        row.exit().remove();
    };

    columnPosition = function (i) {
        i = Math.max(0, i);
        return (x(i) + 115 * (colPartition[i] - 1));
    };

    rowPosition = function (i, j) {
        if (rowPartition[colPartition[j] - 1] === undefined) {
            j = 1;
        }

        var partition = rowPartition[colPartition[j] - 1][i],
            reindex = rowPartitionReindex[colPartition[j] - 1],
            mx = d3.max(reindex);

        j = Math.max(0, j);
        return y[colPartition[j]](i) + (mx > 1 ? (100 / (mx - 1)) * reindex[partition] : 100);
    };

    viewRows = function (y, viewIndex) {
        var col = firstColumnInView[viewIndex],
            rowText = d3.select(this).selectAll(".row-text").data(data.rows);

        rowText.enter().append("text")
            .attr("class", "row-text")
            .attr("x", -6)
            .attr("y", y.rangeBand() / 2)
            .attr("dy", ".32em")
            .attr("transform", function (d, i) { return "translate(" + columnPosition(col) + "," + rowPosition(i, col) + ")"; })
            .attr("text-anchor", "end")
            .text(function (d, i) { return d.name; });
        rowText.style("visibility", col < 0 ? "hidden" : "visible");
        rowText.transition().duration(animationLength)
            .delay(function (d) { return x(firstColumnInView[viewIndex]); })
            .attr("transform", function (d, i) { return "translate(" + columnPosition(col) + "," + rowPosition(i, col) + ")"; });
    };

    order = function (value) {
        var colPermute,
            group,
            cy,
            newIndex,
            curReindex,
            part,
            i,
            t;

        timeValue = value;
        colPartition = data.columnPartition[value];
        rowPartition = data.rowPartition[value];

        function sortColumns(i, j) {
            if (colPartition[i] !== colPartition[j]) {
                return d3.ascending(colPartition[i], colPartition[j]);
            }
            return d3.ascending(data.columns[i].name, data.columns[j].name);
        }

        function sortRows(group) {
            return function (i, j) {
                if (rowPartition[group][i] !== rowPartition[group][j]) {
                    return d3.ascending(rowPartition[group][i], rowPartition[group][j]);
                }
                return d3.ascending(data.rows[i].name, data.rows[j].name);
            };
        }

        colPermute = d3.range(data.columns.length).sort(sortColumns);
        x.domain(colPermute);
        y = [{}];

        rowPartitionReindex = [];
        for (group = 0; group < rowPartition.length; group = group + 1) {
            cy = d3.scale.ordinal().rangeBands([0, height]);
            cy.domain(d3.range(data.rows.length).sort(sortRows(group)));
            y.push(cy);
            newIndex = 0;
            curReindex = [0];
            for (part = 1; part <= data.rows.length; part = part + 1) {
                curReindex.push(newIndex);
                if (rowPartition[group].indexOf(part) >= 0) {
                    newIndex = newIndex + 1;
                }
            }
            rowPartitionReindex.push(curReindex);
        }

        firstColumnInView = [];
        for (i = 0; i < colPartition.length; i = i + 1) {
            while (colPartition[colPermute[i]] > firstColumnInView.length) {
                firstColumnInView.push(colPermute[i]);
            }
        }
        while (firstColumnInView.length < rowPartition.length) {
            firstColumnInView.push(-1);
        }

        t = svg.transition().duration(animationLength);

        updateRows();

        t.selectAll(".cell")
            .delay(function (d) { return x(d.j); })
            .attr("x", function (d) { return columnPosition(d.j); })
            .attr("y", function (d) { return rowPosition(d.i, d.j); });

        t.selectAll(".column")
            .delay(function (d, i) { return x(i); })
            .attr("transform", function (d, i) { return "translate(" + columnPosition(i) + ")rotate(-90)"; });

        if (playing) {
            d3.timer(orderWrapper((value + 1) % 12), animationLength + 3000);
        }
        return true;
    };

    orderWrapper = function (value) {
        return function () {
            if (!playing) {
                return true;
            }
            d3.select("#time").node().selectedIndex = value;
            return order(value);
        };
    };

    // The default sort order.
    x.domain(d3.range(data.columns.length));
    y[0].domain(d3.range(data.rows.length));

    svg.append("rect")
        .attr("class", "background")
        .style("fill", "white")
        .attr("width", width)
        .attr("height", height);

    column = svg.selectAll(".column")
        .data(data.columns)
        .enter().append("g")
        .attr("class", "column")
        .attr("transform", function (d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

    column.append("line")
        .attr("x1", -width);

    column.append("text")
        .attr("x", 6)
        .attr("y", x.rangeBand() / 2)
        .attr("dy", ".32em")
        .attr("text-anchor", "start")
        .text(function (d, i) { return d.name; });

    cell = svg.selectAll(".cell")
        .data(data.table)

        .enter().append("rect")
        .attr("class", "cell")
        .attr("x", function (d) { return x(d.j); })
        .attr("y", function (d) { return y[0](d.i); })
        .attr("width", x.rangeBand())
        .attr("height", y[0].rangeBand())
        .attr("opacity", cellOpacity)
        .style("fill", function (d) { return c(d.value); })
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)

        .append("title")
        .text(function (d) { return d.row + "," + d.col; });

    updateRows();

    d3.select("#time").on("change", function () {
        order(this.value);
    });

    d3.select("#play").on("click", function () {
        playing = !playing;
        d3.select(this).text(playing ? "❚❚" : "▶");
        if (playing) {
            d3.timer(orderWrapper((timeValue + 1) % 12));
        }
    });

    orderWrapper(0)();
});
