function (vis) {
    d3.selectAll(".mark-0 > *")
        .on("mouseover", function () {
            d3.select(this).transition(1000).style("fill", "orange");
        })
        .on("mouseout", function () {
            d3.select(this).transition(1000).style("fill", "lightblue");
        })
        .on("click", function (d) {
            alert("You clicked something size " + d.b);
        });
}
