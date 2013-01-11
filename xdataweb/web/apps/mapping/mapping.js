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
  d3.selectAll("#content *").remove();
  eval('var vis = ' + d3.select("#code")[0][0].value);
  var source = vg.compile(vis, template.join("\n"));
  var el = "#content";
  console.log(source);
  eval(source);
}

function load() {
  var host = d3.select("#host")[0][0].value;
  var db = d3.select("#db")[0][0].value;
  var collection = d3.select("#collection")[0][0].value;
  var query = d3.select("#query")[0][0].value;
  var limit = +d3.select("#limit")[0][0].value;
  console.log(query);
  $.ajax({
    type: 'POST',
    url: '/service/mongo/' + host + '/' + db + '/' + collection,
    data: {query: query, limit: limit},
    dataType: "json",
    success: function(response) {
      console.log(response);
      if (response.result.length > 0) {
        data.table = response.result;
        for (var i = 0; i < data.table.length; ++i) {
          for (var d in data.table[i]) {
            for (var e in data.table[i][d]) {
              data.table[i][d + '.' + e] = data.table[i][d][e];
            }
          }
        }
        update();
      }
    }
  });
}

window.onload = function() {
  d3.select("#load").on("click", load);
  d3.json("world-countries.json", function(json) {
    data.regions = json.features.map(function(x) { return {r:x}; });
    d3.json("cities.json", function(cities) {
      var idx = d3.range(cities[0].values.length);
      data.cities = idx.map(function(i) { return cities.reduce(
        function(a,b) { a[b.name] = b.values[i]; return a; }, {}); });
    });
  });
  d3.text("map.json", function(code) {
    d3.select("#code").text(code);
  });
};
