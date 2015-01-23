function barchart(vegaSpec) {
    vg.parse.spec(vegaSpec, function (chart) {
        chart({
            el: "#chart"
        }).update();
    });
}

function configure(specTemplate, cfg) {
    var copy = JSON.parse(JSON.stringify(specTemplate));
    copy.width = cfg.width;
    copy.height = cfg.height;
    copy.data[0].url = "writers?sort=" + cfg.sort;
    copy.scales[0].domain.field = "data." + cfg.value;
    copy.scales[1].domain.field = "data." + cfg.label;
    copy.marks[0].properties.enter.x.field = "data." + cfg.label;
    copy.marks[0].properties.enter.y.field = "data." + cfg.value;
    copy.marks[1].properties.enter.x.field = "data." + cfg.label;
    copy.marks[1].properties.enter.y.value = cfg.height + 5;
    copy.marks[1].properties.enter.text.field = "data." + cfg.label;

    return copy;
}

window.onload = function () {
    d3.json("barchart.json", function (specTemplate) {
        var chartSpec = configure(specTemplate, {
            width: 4000,
            height: 500,
            sort: true,
            label: "name",
            value: "count"
        });

        barchart(chartSpec);
    });
};
