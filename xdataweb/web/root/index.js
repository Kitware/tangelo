window.onload = function(){
    d3.json("/apps.json", function(err, apps){
        if(err !== null){
            console.log("fatal error: could not load app list from /apps.json");
            return;
        }

        // Grab a reference to each of the two index columns.
        var left = d3.select("#left");
        var right = d3.select("#right");

        var cols = [left, right];

        // Place the app info/links into the two columns, alternating between
        // left and right.
        for(var i=0; i<apps.length; i++){
            var col = cols[i % 2];
            var app = apps[i];

            col.append("a")
                .attr("href", "/apps/" + app.path + "/index.html")
                .append("h4")
                    .html(app.name);
            col.append("p")
                .html(app.description);
        }
    });
};
