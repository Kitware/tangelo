window.onload = function () {
    var data = {
        nodes: [
            {value: 10, group: 'a', name: 'node 1'},
            {value: 20, group: 'a', name: 'node 2'},
            {value: 30, group: 'b', name: 'node 3'},
            {value: 40, group: 'b', name: 'node 4'},
            {value: 50, group: 'c', name: 'node 5'},
            {value: 60, group: 'c', name: 'node 6'},
            {value: 70, group: 'd', name: 'node 7'}
        ],
        links: [
            {s: 0, t: 1},
            {s: 1, t: 2},
            {s: 2, t: 3},
            {s: 3, t: 4},
            {s: 4, t: 5},
            {s: 5, t: 6},
            {s: 6, t: 0}
        ]
    };

    $("#content").nodelink({
        data: data,
        nodeCharge: {value: -400},
        linkSource: {field: "s"},
        linkTarget: {field: "t"},
        nodeSize: {field: "value"},
        nodeColor: {field: "group"},
        nodeLabel: {field: "name"}
    });
};
