/*jslint browser: true, unparam: true*/

/*globals d3 */

function visCrossCat(spec) {
    "use strict";
    var that,
        matrix = spec.matrix,
        margin = spec.margin || {top: 200, right: 800, bottom: 200, left: 150},
        color = spec.color || d3.scale.category20().domain([1, 0]),
        cellSize = spec.cellSize || 15,
        rows,
        columns,
        views,
        columnPermute,
        rowPermute,
        partitions,
        numPartitions,
        firstColumnInView,
        svg;

    function updateVisualization() {
        var cell,
            column,
            row,
            updateCellRow;

        function columnPosition(j) {
            j = Math.max(0, j);
            return columnPermute[j] * cellSize + 115 * views[j];
        }

        function rowPosition(i, j) {
            j = Math.max(0, j);
            var numParts = numPartitions[views[j]],
                partOffset;
            if (numParts === 1) {
                partOffset = 100;
            } else {
                partOffset = 100 / (numParts - 1) * partitions[views[j]][i];
            }
            return rowPermute[views[j]][i] * cellSize + partOffset;
        }

        function cellOpacity(d) {
            var opacity = 1;
            if (d.value === 0) {
                opacity = 0.5;
            }
            return opacity;
        }

        function mouseover(p) {
            d3.selectAll(".row text.row-text").classed("active", function (d) { return d === rows[p.i]; });
            d3.selectAll(".column text").classed("active", function (d, i) { return i === p.j; });
            d3.selectAll(".cell").attr("opacity", function (d) {
                var opacity = cellOpacity(d);
                if (d.i !== p.i) {
                    opacity *= 0.25;
                }
                return opacity;
            });
        }

        function mouseout() {
            d3.selectAll("text").classed("active", false);
            d3.selectAll(".cell").classed("active", false);
            d3.selectAll(".cell").attr("opacity", cellOpacity);
        }

        updateCellRow = function (partition, viewIndex) {
            var col = firstColumnInView[viewIndex],
                rowText = d3.select(this).selectAll(".row-text").data(rows);

            rowText.enter().append("text")
                .attr("class", "row-text")
                .attr("x", -6)
                .attr("y", cellSize / 2)
                .attr("dy", ".32em")
                .attr("transform", function (d, i) { return "translate(" + columnPosition(col) + "," + rowPosition(i, col) + ")"; })
                .attr("text-anchor", "end")
                .text(function (d, i) { return d; });
            rowText.style("visibility", col < 0 ? "hidden" : "visible");
            rowText.transition().duration(1000)
                .delay(function (d) { return columnPosition(col); })
                .attr("transform", function (d, i) { return "translate(" + columnPosition(col) + "," + rowPosition(i, col) + ")"; });
        };

        column = svg.selectAll(".column")
            .data(columns);
        column.enter().append("g")
            .attr("class", "column")
            .attr("transform", function (d, i) { return "translate(" + columnPosition(i) + ")rotate(-90)"; })
            .append("text")
            .attr("x", 6)
            .attr("y", cellSize / 2)
            .attr("dy", ".32em")
            .attr("text-anchor", "start")
            .text(function (d) { return d; });
        column.transition().duration(1000)
            .delay(function (d, i) { return columnPosition(i); })
            .attr("transform", function (d, i) { return "translate(" + columnPosition(i) + ")rotate(-90)"; });

        row = svg.selectAll(".row")
            .data(partitions);
        row.enter().append("g")
            .attr("class", "row")
            .each(updateCellRow);
        row.exit().remove();
        row.transition().duration(1000)
            .each(updateCellRow);

        cell = svg.selectAll(".cell")
            .data(matrix);
        cell.enter().append("rect")
            .attr("class", "cell")
            .attr("x", function (d) { return columnPosition(d.j); })
            .attr("y", function (d) { return rowPosition(d.i, d.j); })
            .attr("width", cellSize + 1)
            .attr("height", cellSize + 1)
            .attr("opacity", cellOpacity)
            .style("fill", function (d) { return color(d.value); })
            .on("mouseover", mouseover)
            .on("mouseout", mouseout)
            .append("title")
            .text(function (d) { return rows[d.i] + " " + columns[d.j] + "? " + (d.value ? "YES" : "NO"); });
        cell.transition().duration(1000)
            .delay(function (d) { return columnPosition(d.j); })
            .attr("x", function (d) { return columnPosition(d.j); })
            .attr("y", function (d) { return rowPosition(d.i, d.j); });
    }

    function updateData(columnOrder, rowOrder, columnPartitions, rowPartitions) {
        var column,
            columnName,
            columnPermuteInverted,
            rowName,
            view;

        // Sort columns first by view, then by column name.
        function sortColumns(i, j) {
            if (views[i] !== views[j]) {
                return d3.ascending(views[i], views[j]);
            }
            return d3.ascending(columns[i], columns[j]);
        }

        // Sort rows first by partition, then by row name.
        function sortRows(view) {
            return function (i, j) {
                if (partitions[view][i] !== partitions[view][j]) {
                    return d3.ascending(partitions[view][i], partitions[view][j]);
                }
                return d3.ascending(rows[i], rows[j]);
            };
        }

        // Given an array containing a permutation (i.e. it has values in the
        // range 0 to arr.length - 1 that each appear only once), find
        // the inverse permutation such that inverse[arr[i]] === i for all i.
        function invertPermutation(arr) {
            var i,
                inverse = [];
            for (i = 0; i < arr.length; i = i + 1) {
                inverse[arr[i]] = i;
            }
            return inverse;
        }

        // Computes new values for an array by re-indexing values
        // so that all values not present in the array are skipped,
        // preserving the original ordering of the values.
        // For example,
        //     > result = removeNonEmpty([1, 4, 1, 3]);
        //     > result;
        //     [0, 2, 0, 1]
        // The returned array also contains a remappedIndex field
        // that contains an array mapping old indices to new indices.
        // In our example,
        //     > result.remappedIndex;
        //     [undefined, 0, undefined, 1, 2]
        //     > remappedIndex[1] => 0
        //     > remappedIndex[3] => 1
        //     > remappedIndex[4] => 2
        function removeNonEmpty(arr) {
            var i,
                notEmpty = [],
                numEmpty = 0,
                result = [];

            for (i = 0; i < arr.length; i = i + 1) {
                notEmpty[arr[i]] = true;
            }

            result.remappedIndex = [];
            for (i = 0; i < notEmpty.length; i = i + 1) {
                if (notEmpty[i]) {
                    result.remappedIndex[i] = i - numEmpty;
                } else {
                    numEmpty = numEmpty + 1;
                }
            }

            for (i = 0; i < arr.length; i = i + 1) {
                result[i] = result.remappedIndex[arr[i]];
            }

            return result;
        }

        rows = [];
        for (rowName in rowOrder.labelToIndex) {
            if (rowOrder.labelToIndex.hasOwnProperty(rowName)) {
                rows[rowOrder.labelToIndex[rowName] - 1] = rowName.toLowerCase();
            }
        }

        columns = [];
        for (columnName in columnOrder.labelToIndex) {
            if (columnOrder.labelToIndex.hasOwnProperty(columnName)) {
                columns[columnOrder.labelToIndex[columnName] - 1] = columnName.replace(/_/g, " ");
            }
        }

        // Reindex all indices to be zero-based and eliminate empty views/partitions.
        views = removeNonEmpty(columnPartitions.columnPartitionAssignments);
        partitions = [];
        for (view = 0; view < rowPartitions.rowPartitionAssignments.length; view = view + 1) {
            if (views.remappedIndex[view + 1] !== undefined) {
                partitions[views.remappedIndex[view + 1]] = removeNonEmpty(rowPartitions.rowPartitionAssignments[view]);
            }
        }

        // Determine the ordering of columns and rows in this view.
        columnPermuteInverted = d3.range(columns.length).sort(sortColumns);
        columnPermute = invertPermutation(columnPermuteInverted);
        rowPermute = [];
        for (view = 0; view < partitions.length; view = view + 1) {
            rowPermute[view] = invertPermutation(d3.range(rows.length).sort(sortRows(view)));
        }

        // Compute the number of partitions in each view.
        numPartitions = [];
        for (view = 0; view < partitions.length; view = view + 1) {
            numPartitions[view] = d3.max(partitions[view]) + 1;
        }

        // We need the first column in each view to know where to place the row labels.
        firstColumnInView = [];
        for (column = 0; column < views.length; column = column + 1) {
            while (views[columnPermuteInverted[column]] >= firstColumnInView.length) {
                firstColumnInView.push(columnPermuteInverted[column]);
            }
        }
        while (firstColumnInView.length < partitions.length) {
            firstColumnInView.push(-1);
        }

        // Update the visualization
        updateVisualization();
    }

    svg = d3.select("#svg")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    that = {};

    that.update = function (id) {
        d3.json("data/Cc_" + id + ".json", function (columnOrder) {
            d3.json("data/Cr_" + id + ".json", function (rowOrder) {
                d3.json("data/XL_" + id + ".json", function (columnPartitions) {
                    d3.json("data/XD_" + id + ".json", function (rowPartitions) {
                        updateData(columnOrder, rowOrder, columnPartitions, rowPartitions);
                    });
                });
            });
        });
    };

    return that;
}

(function () {
    "use strict";
    d3.json("data/animals_data.json", function (data) {
        var i,
            ids,
            j,
            matrix,
            playing = true,
            timerId,
            vis;

        function updater() {
            var time = d3.select("#time").node();
            time.selectedIndex = (time.selectedIndex + 1) % ids.length;
            vis.update(ids[time.selectedIndex]);
        }

        ids = [
            "73524567995_00",
            "73524568270_01",
            "73524568278_02",
            "73524568287_03",
            "73524568298_04",
            "73524568305_05",
            "73524568313_06",
            "73524568322_07",
            "73524568328_08",
            "73524568338_09",
            "73524568345_10",
            "73524568352_11"
        ];

        matrix = [];
        for (i = 0; i < data.length; i = i + 1) {
            for (j = 0; j < data[i].length; j = j + 1) {
                matrix.push({i: i, j: j, value: data[i][j]});
            }
        }
        vis = visCrossCat({matrix: matrix});

        d3.select("#time").selectAll("option")
            .data(ids)
            .enter().append("option")
            .attr("value", function (d) { return d; })
            .text(function (d) { return d.split("_")[1]; });

        d3.select("#time").on("change", function () {
            playing = false;
            d3.select("#play i").attr("class", "icon-play icon-white");
            clearTimeout(timerId);
            vis.update(this.value);
        });

        d3.select("#play").on("click", function () {
            playing = !playing;
            d3.select("#play i").attr("class", (playing ? "icon-pause" : "icon-play") + " icon-white");
            if (playing) {
                timerId = setInterval(updater, 5000);
            } else {
                clearTimeout(timerId);
            }
        });

        if (playing) {
            timerId = setInterval(updater, 5000);
        }
    });
}());
