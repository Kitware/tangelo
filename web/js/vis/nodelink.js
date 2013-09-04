/*jslint browser: true */

(function (tangelo, d3) {
    "use strict";

    tangelo.vis.nodelink = function (spec) {
        var colorScale,
            sizeScale,
            nodeColor = tangelo.accessor(spec.nodeColor, "steelblue"),
            nodeSize = tangelo.accessor(spec.nodeSize, 10),
            nodeLabel = tangelo.accessor(spec.nodeLabel, undefined),
            linkSource = tangelo.accessor(spec.linkSource, 0),
            linkTarget = tangelo.accessor(spec.linkTarget, 0),
            width = spec.width || 1000,
            height = spec.height || 1000,
            force,
            svg,
            link,
            node,
            data = spec.data,
            that = {};

        data.links.forEach(function (d) {
            d.source = linkSource(d);
            d.target = linkTarget(d);
        });

        colorScale = d3.scale.category20();
        sizeScale = d3.scale.sqrt()
            .domain(d3.extent(data.nodes, function (d) { return nodeSize(d); }))
            .range([5, 15]);

        force = d3.layout.force()
            .charge(-120)
            .linkDistance(30)
            .size([width, height]);

        svg = d3.select(spec.el).append("svg")
            .attr("width", width)
            .attr("height", height);

        force
            .nodes(data.nodes)
            .links(data.links)
            .start();

        link = svg.selectAll(".link")
            .data(data.links);
        link.enter().append("line")
            .attr("class", "link")
            .style("stroke", "black")
            .style("stroke-width", 1);

        node = svg.selectAll(".node")
            .data(data.nodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", function (d) { return sizeScale(nodeSize(d)); })
            .style("fill", function (d) { return colorScale(nodeColor(d)); })
            .call(force.drag);

        node.append("title")
            .text(function(d) { return nodeLabel(d); });

        force.on("tick", function() {
            link.attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });

            node.attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; });
        });

        function update() {
            return that;
        }

        that.update = update;

        return that;
    };

}(window.tangelo, window.d3));