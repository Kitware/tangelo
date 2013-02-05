/*jslint browser: true */

/*globals $, d3 */

var data;

function update() {
    "use strict";

    d3.selectAll("#content *").remove();

    /*jslint evil: true */
    data = eval(d3.select("#data")[0][0].value);
    eval(d3.select("#code")[0][0].value);
    /*jslint evil: false */
}

function save() {
    "use strict";

    $.ajax({
        type: 'POST',
        url: '/service/datatwiddle/mongo/xdata/twiddles',
        data: {
            name: $("#name").val(),
            data: $("#data").val(),
            code: $("#code").val(),
        },
        dataType: "json",
        success: function (response) {
            console.log("did it!");
        }
    });
}

function load() {
    "use strict";

    $.ajax({
        type: 'POST',
        url: '/service/datatwiddle/mongo/xdata/twiddles',
        data: {
            name: d3.select("#name")[0][0].value,
        },
        dataType: "json",
        success: function (response) {
            if (response.result.length > 0) {
                var res = response.result[0];
                $("#data").val(res.data);
                $("#code").val(res.code);
            }
        }
    });
}

window.onload = function () {
    "use strict";

    d3.select("#run").on("click", update);
    d3.select("#save").on("click", save);
    d3.select("#load").on("click", load);
};

