/*globals $, tangelo */

$(function () {
    "use strict";

    var data = [
            {x: 1,  y: 28}, {x: 2,  y: 55},
            {x: 3,  y: 43}, {x: 4,  y: 91},
            {x: 5,  y: 81}, {x: 6,  y: 53},
            {x: 7,  y: 19}, {x: 8,  y: 87},
            {x: 9,  y: 52}, {x: 10, y: 48},
            {x: 11, y: 24}, {x: 12, y: 49},
            {x: 13, y: 87}, {x: 14, y: 66},
            {x: 15, y: 17}, {x: 16, y: 27},
            {x: 17, y: 68}, {x: 18, y: 16},
            {x: 19, y: 49}, {x: 20, y: 15}
        ],
        initSize = {
            width: 350,
            height: 200
        },
        barChartOption = {
            data: data,
            width: 0,
            height: 0,
            horizontal: false,
            label: tangelo.accessor({field: "x"}),
            value: tangelo.accessor({field: "y"})
        },
        margin = {
            resizable: {
                width: 100,
                height: 50
            },
            windows: {
                width: 100,
                height: 320
            }
        };

    function updateSizeDisplay() {
        $("#width").val(Math.round(barChartOption.width));
        $("#height").val(Math.round(barChartOption.height));
    }

    function resizeBarChart(width, height, option) {
        barChartOption.width = width;
        barChartOption.height = height;
        $("#content").barChart("resize", barChartOption.width, barChartOption.height);
        if (!option) {
            updateSizeDisplay();
        }
    }

    function windowResizer() {
        var win = $(window);
        resizeBarChart(win.width() - margin.windows.width, win.height() - margin.windows.height);
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
                if (eve) {
                    resizeBarChart(ui.size.width - margin.resizable.width, ui.size.height - margin.resizable.height);
                }
            },
            stop: function (eve, ui) {
                if (eve) {
                    resizeBarChart(ui.size.width - margin.resizable.width, ui.size.height - margin.resizable.height);
                }
            }
        });
    }
    createResizableContainer();
    $("#content").barChart(barChartOption);
    updateSizeDisplay();

    function cleanupContent() {
        var container = $("#content").parent();
        $("#content").remove();
        container.append("<div id=\"content\"></div>");
    }

    function updateBarChartOrientation(option) {
        if (option !== barChartOption.horizontal) {
            barChartOption.horizontal = option;
            cleanupContent();
            $("#content").barChart(barChartOption);
        }
    }

    function updateResizingOption(option) {
        if (option === "0") {
            disableInput();
            $(window).off("resize", windowResizer);
            createResizableContainer();
            barChartOption.width = initSize.width;
            barChartOption.height = initSize.height;
            $("#content").barChart(barChartOption);
            updateSizeDisplay();
        } else if (option === "1") {
            disableInput();
            $("#content").remove();
            $("#bar-chart-panel").remove();
            $("#content-wrapper").append("<div id=content></div>");
            barChartOption.width = $(window).width() - margin.windows.width;
            barChartOption.height = $(window).height() - margin.windows.height;
            $("#content").barChart(barChartOption);
            $(window).resize(windowResizer);
            updateSizeDisplay();
        } else {
            $(window).off("resize", windowResizer);
            $("#content").remove();
            $("#bar-chart-panel").remove();
            $("#content-wrapper").append("<div id=content></div>");
            enableInput();
            $("#content").barChart(barChartOption);
        }
    }

    $("input:radio[name='orientation']").change(function () {
        var value = $(this).val();
        if (value === "1") {
            updateBarChartOrientation(true);
        } else {
            updateBarChartOrientation(false);
        }
    });

    $("input:radio[name='size-option']").change(function () {
        var value = $(this).val();
        updateResizingOption(value);
    });

    $("input:text[id='width']").change(function () {
        var value = $(this).val();
        resizeBarChart(Math.round(value), barChartOption.height, true);
    });

    $("input:text[id='height']").change(function () {
        var value = $(this).val();
        resizeBarChart(barChartOption.width, Math.round(value), true);
    });
});
