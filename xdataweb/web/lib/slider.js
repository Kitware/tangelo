/*jslint */

/*globals xdw, $ */

(function () {
    "use strict";

    var mod = xdw.namespace("util");

    mod.slider = function (sliderelem, callbacks) {
        var s,
            onchange,
            onslide,
            config;

        // Make DOM element into a jQuery selction.
        s = $(sliderelem);

        // Capture the user-supplied callbacks (missing ones will be captures as
        // "undefined").
        onchange = callbacks.onchange;
        onslide = callbacks.onslide;

        // Set up a config that uses the user-supplied callbacks.
        config = {
            change: function (e, ui) {
                if (onchange) {
                    onchange(ui.value);
                }
            },

            slide: function (e, ui) {
                if (onslide) {
                    onslide(ui.value);
                }
            }
        };

        // Return an interface object.
        return {
            initialize: function () { s.slider(config); },
            setMin: function (min) { config.min = min; s.slider(config); },
            setMax: function (max) { config.max = max; s.slider(config); },
            getValue: function () { return s.slider("value"); }
        };
    };

    mod.rangeSlider = function (sliderelem, callbacks) {
        var slider,
            onchange,
            onslide,
            config;

        // Make the slider element into a jQuery selection.
        slider = $(sliderelem);

        // Capture the two callbacks (if these were not specified, they will be
        // captured as "undefined").
        onchange = callbacks.onchange;
        onslide = callbacks.onslide;

        // Set up a basic configuration that simply calls the user-supplied
        // callbacks.
        config = {
            range: true,

            change: function (e, ui) {
                if (onchange) {
                    onchange(ui.values[0], ui.values[1]);
                }
            },

            slide: function (e, ui) {
                if (onslide) {
                    onslide(ui.values[0], ui.values[1]);
                }
            }
        };

        // Return the user an interface object.
        return {
            initialize: function () { slider.slider(config); },
            getMin: function () { return config.min; },
            getMax: function () { return config.max; },
            setMin: function (min) { config.min = min; slider.slider(config); },
            setMax: function (max) { config.max = max; slider.slider(config); },
            setLowValue: function (v) { slider.slider("values", [v, slider.slider("values")[1]]); },
            setHighValue: function (v) { slider.slider("values", [slider.slider("values")[0], v]); },
            getValue: function () { return slider.slider("values"); }
        };
    };
}());
