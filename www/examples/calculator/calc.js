/*jslint browser: true */
/*globals $, tangelo, d3 */

$(function () {
    "use strict";

    function do_arithmetic(op) {
        var a_val = $("#input-a").val();
        var b_val = $("#input-b").val();

        $.ajax({
            url: "calc/" + op,
            data: {
                a: a_val,
                b: b_val
            },
            dataType: "text",
            success: function (response) {
                $("#result").text(response);
            },
            error: function (jqxhr, textStatus, reason) {
                $("#result").html(reason);
            }
        });
    }

    $("#plus").click(function () {
        do_arithmetic("add");
    });

    $("#minus").click(function () {
        do_arithmetic("subtract");
    });

    $("#times").click(function () {
        do_arithmetic("multiply");
    });

    $("#divide").click(function () {
        do_arithmetic("divide");
    });
});
