/*globals $, tangelo */

$(function () {
    "use strict";

    var data = [
            {label: 1, value: 53245}, {label: 2, value: 28479},
            {label: 3, value: 19697}, {label: 4, value: 24037},
            {label: 5, value: 40245}, {label: 6, value: 34355}
        ],
        initSize = {
            width: 400,
            height: 240,
            inner: 30 /* this is the ratio of the inner/outradius */
        },
        margin = {
            resizable: {
                width: 20,
                height: 20
            },
            windows: {
                width: 100,
                height: 320
            }
        },
        donutChartOptions = {
            data: data,
            width: initSize.width,
            height: initSize.height,
            inner: initSize.inner,
            label: tangelo.accessor({field: "label"}),
            value: tangelo.accessor({field: "value"})
        };

    function updateInputOptions() {
        $("input:text[id='inner']").val(donutChartOptions.inner);
        $("input:text[id='width']").val(donutChartOptions.width);
        $("input:text[id='height']").val(donutChartOptions.height);
    }

    function resizeDonutChart(width, height, inner, update) {
        donutChartOptions.width = Math.round(width);
        donutChartOptions.height = Math.round(height);
        if (inner !== undefined) {
            donutChartOptions.inner = inner;
        }
        $("#content").donutChart("destroy");
        $("#content").donutChart(donutChartOptions);
        if (update) {
            updateInputOptions();
        }
    }

    function windowResizer() {
        var win = $(window);
        resizeDonutChart(win.width() - margin.windows.width, win.height() - margin.windows.height, undefined, true);
    }

    function disableInput() {
        $("#width").prop("readonly", "readonly");
        $("#height").prop("readonly", "readonly");
        $("#inner").prop("readonly", "readonly");
    }

    function enableInput() {
        $("#width").prop("readonly", "");
        $("#height").prop("readonly", "");
        $("#inner").prop("readonly", "");
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
                resizeDonutChart(ui.size.width - margin.resizable.width, ui.size.height - margin.resizable.height);
                updateInputOptions();
            },
            stop: function (eve, ui) {
                if (!eve) {
                    return;
                }
                resizeDonutChart(ui.size.width - margin.resizable.width, ui.size.height - margin.resizable.height);
                updateInputOptions();
            }
        });
    }

    createResizableContainer();
    $("#content").donutChart(donutChartOptions);
    updateInputOptions();

    function initDonutChartSize() {
        donutChartOptions.width = initSize.width;
        donutChartOptions.height = initSize.height;
    }

    function updateResizingOption(option) {
        if (option === "0") {
            disableInput();
            $(window).off("resize", windowResizer);
            createResizableContainer();
            initDonutChartSize();
            $("#content").donutChart(donutChartOptions);
            updateInputOptions();
        } else if (option === "1") {
            disableInput();
            $("#content").remove();
            $("#bar-chart-panel").remove();
            $("#content-wrapper").append("<div id=content></div>");
            $(window).resize(windowResizer);
            donutChartOptions.width = Math.round($(window).width() - margin.windows.width);
            donutChartOptions.height = Math.round($(window).height() - margin.windows.height);
            $("#content").donutChart(donutChartOptions);
            updateInputOptions();
        } else {
            $(window).off("resize", windowResizer);
            $("#content").remove();
            $("#bar-chart-panel").remove();
            $("#content-wrapper").append("<div id=content></div>");
            enableInput();
            $("#content").donutChart(donutChartOptions);
        }
    }

    $("input:radio[name='size-option']").change(function () {
        var value = $(this).val();
        updateResizingOption(value);
    });

    $("input:text[id='width']").change(function () {
        var value = $(this).val();
        resizeDonutChart(Math.round(value), donutChartOptions.height, donutChartOptions.inner);
    });

    $("input:text[id='height']").change(function () {
        var value = $(this).val();
        resizeDonutChart(donutChartOptions.width, Math.round(value), donutChartOptions.inner);
    });

    $("input:text[id='inner']").change(function () {
        var value = $(this).val();
        resizeDonutChart(donutChartOptions.width, donutChartOptions.height, Math.round(value));
    });
});
