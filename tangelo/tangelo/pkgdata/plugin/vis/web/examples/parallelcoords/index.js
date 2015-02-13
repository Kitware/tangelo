/*globals $, d3 */

$(function () {
    "use strict";

    var parallelCoords = {
            width: 0,
            height: 0,
            dataUrl: "cars.json",
            fields: ["cyl", "dsp", "lbs", "hp", "acc", "mpg", "year"]
        },
        initSize = {
            width: 350,
            height: 200
        },
        margin = {
            resizable: {
                width: 70,
                height: 50
            },
            windows: {
                width: 100,
                height: 320
            }
        };

    function updateSizeDisplay() {
        $("#width").val(Math.round(parallelCoords.width));
        $("#height").val(Math.round(parallelCoords.height));
    }

    function resizeChart(width, height, option) {
        parallelCoords.width = width;
        parallelCoords.height = height;
        $("#content").parallelCoords("resize", parallelCoords.width, parallelCoords.height);
        if (!option) {
            updateSizeDisplay();
        }
    }

    function windowResizer() {
        var win = $(window);
        resizeChart(win.width() - margin.windows.width, win.height() - margin.windows.height);
    }

    function disableInput() {
        $("#width").prop("readonly", "readonly");
        $("#height").prop("readonly", "readonly");
    }

    function enableInput() {
        $("#width").prop("readonly", "");
        $("#height").prop("readonly", "");
    }

    function createResizableContainer() {
        $("#bar-chart-panel").remove();
        $("#content").remove();
        $("#content-wrapper").append("<div id=bar-chart-panel class=ui-widget-content><div id=content></div></div>");
        $("#bar-chart-panel").resizable({
            resize: function (eve, ui) {
                if (!eve) {
                    return;
                }
                resizeChart(ui.size.width - margin.resizable.width, ui.size.height - margin.resizable.height);
            },
            stop: function (eve, ui) {
                if (!eve) {
                    return;
                }
                resizeChart(ui.size.width - margin.resizable.width, ui.size.height - margin.resizable.height);
            }
        });
    }

    d3.json(parallelCoords.dataUrl, function (error, json) {
        if (error) {
            console.log(error);
            return;
        }
        parallelCoords.data = json;
        createResizableContainer();
        $("#content").parallelCoords(parallelCoords);
        updateSizeDisplay();
    });

    function updateResizingOption(option) {
        if (option === "0") {
            disableInput();
            $(window).off("resize", windowResizer);
            createResizableContainer();
            parallelCoords.width = initSize.width;
            parallelCoords.height = initSize.height;
            $("#content").parallelCoords(parallelCoords);
            updateSizeDisplay();
        } else if (option === "1") {
            disableInput();
            $("#content").remove();
            $("#bar-chart-panel").remove();
            $("#content-wrapper").append("<div id=content></div>");
            parallelCoords.width = $(window).width() - margin.windows.width;
            parallelCoords.height = $(window).height() - margin.windows.height;
            $("#content").parallelCoords(parallelCoords);
            $(window).resize(windowResizer);
            updateSizeDisplay();
        } else {
            $(window).off("resize", windowResizer);
            $("#content").remove();
            $("#bar-chart-panel").remove();
            $("#content-wrapper").append("<div id=content></div>");
            enableInput();
            $("#content").parallelCoords(parallelCoords);
        }
    }

    $("input:radio[name='size-option']").change(function () {
        var value = $(this).val();
        updateResizingOption(value);
    });

    $("input:text[id='width']").change(function () {
        var value = $(this).val();
        resizeChart(Math.round(value), parallelCoords.height, true);
    });

    $("input:text[id='height']").change(function () {
        var value = $(this).val();
        resizeChart(parallelCoords.width, Math.round(value), true);
    });
});
