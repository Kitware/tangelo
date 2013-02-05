/*jslint browser: true */

/*globals d3, vg, $ */

var data = {};
var template = [
    "var scales = {};",
    "var encoders = {};",
    "var axes = [];",
    "var dom = null;",
    "var width = {{WIDTH}};",
    "var height = {{HEIGHT}};",
    "var padding = {{PADDING}};",
    "var duration = {{DURATION}};",
    "{{INIT_SCALES}}",
    "{{INIT_ENCODERS}}",
    "{{INIT_AXES}}",
    "{{INIT_DOM}}",
    "{{UPDATE_AXES}}",
    "{{UPDATE_MARKS}}"
];

function update() {
    "use strict";

    var vis,
        source,
        el;

    d3.selectAll("#content *").remove();

    /*jslint evil: true */
    eval('vis = ' + d3.select("#code")[0][0].value);
    /*jslint evil: false */

    source = vg.compile(vis, template.join("\n"));
    el = "#content";
    console.log(source);

    /*jslint evil: true */
    eval(source);
    /*jslint evil: false */
}

function load() {
    "use strict";

    var host,
        db,
        collection,
        query,
        limit;

    host = d3.select("#host")[0][0].value;
    db = d3.select("#db")[0][0].value;
    collection = d3.select("#collection")[0][0].value;
    query = d3.select("#query")[0][0].value;
    limit = +d3.select("#limit")[0][0].value;
    console.log(query);
    $.ajax({
        type: 'POST',
        url: '/service/mongo/' + host + '/' + db + '/' + collection,
        data: {query: query, limit: limit},
        dataType: "json",
        success: function (response) {
            var i,
                d,
                e;

            console.log(response);
            if (response.result.length > 0) {
                data.table = response.result;
                for (i = 0; i < data.table.length; i += 1) {
                    for (d in data.table[i]) {
                        if (data.table[i].hasOwnProperty(d)) {
                            for (e in data.table[i][d]) {
                                if (data.table[i][d].hasOwnProperty(e)) {
                                    data.table[i][d + '.' + e] = data.table[i][d][e];
                                }
                            }
                        }
                    }
                }
                update();
            }
        }
    });
}

window.onload = function () {
    "use strict";

    var idx;

    d3.select("#load").on("click", load);
    d3.json("world-countries.json", function (json) {
        data.regions = json.features.map(function (x) { return {r: x}; });
        d3.json("cities.json", function (cities) {
            idx = d3.range(cities[0].values.length);
            data.cities = idx.map(function (i) {
                return cities.reduce(function (a, b) {
                    a[b.name] = b.values[i];
                    return a;
                }, {});
            });
        });
    });
    d3.text("map.json", function (code) {
        d3.select("#code").text(code);
    });
};
