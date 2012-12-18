window.onload = function(){
    console.log("hello");

    d3.select("#quartile").node().onclick = function(){
        alert("quartile");
    };

    d3.select("#decile").node().onclick = function(){
        alert("decile");
    };

    d3.select("#percentile").node().onclick = function(){
        alert("percentile");
    };
};
