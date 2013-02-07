/*jslint */

/*globals xdw, $ */

/**
 * @fileOverview This file supplies the interface for creating and managing
 * jQuery UI slider elements.
 */

(function () {
    "use strict";

    /**
     * @name slider
     * @memberOf xdw
     *
     * @namespace Classes for creating and controlling jQuery slider elements.
     */
    var mod = xdw.namespace("slider");

    /**
     * @name slider
     * @memberOf xdw.slider
     *
     * @class A single-value jQuery slider control.
     *
     * @param {string} sliderelem A selector for the element that will become
     * the slider object (e.g. <i>"#opacityslider"</i>, etc.).
     *
     * @param {object} callbacks An object containing two callback functions.
     *
     * @config {function} [onchange] If supplied, called with current slider
     * value after a change to the slider is completed.
     *
     * @config {function} [onslide] If supplied, called with current slider
     * value every time the slider position changes during a sliding motion.
     */
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
        /**
         * @lends xdw.slider.slider.prototype
         */
        return {
            /** Initializes the slider element. */
            initialize: function () { s.slider(config); },

            /** Sets the low end of the slider range.
             *
             * @param {number} min The new value.
             */
            setMin: function (min) { config.min = min; s.slider(config); },

            /** Sets the high end of the slider range.
             *
             * @param {number} max The new value.
             */
            setMax: function (max) { config.max = max; s.slider(config); },

            /** Returns the current slider value.
             *
             * @returns {number} The current slider value.
             */
            getValue: function () { return s.slider("value"); }
        };
    };

    /**
     * @name xdw.slider.rangeSlider
     *
     * @class A range-valued jQuery slider control.
     *
     * @param {string} sliderelem A selector for the element that will become
     * the slider object (e.g. <i>"#opacityslider"</i>, etc.).
     *
     * @param {object} callbacks An object containing two callback functions.
     *
     * @config {function} [onchange] If supplied, called with current slider
     * values after a change to the slider is completed.
     *
     * @config {function} [onslide] If supplied, called with current slider
     * values every time the slider position changes during a sliding motion.
     */
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

            /** @ignore */
            change: function (e, ui) {
                if (onchange) {
                    onchange(ui.values[0], ui.values[1]);
                }
            },

            /** @ignore */
            slide: function (e, ui) {
                if (onslide) {
                    onslide(ui.values[0], ui.values[1]);
                }
            }
        };

        // Return the user an interface object.
        /**
         * @lends xdw.slider.rangeSlider.prototype
         */
        return {
            /** Initializes the slider element. */
            initialize: function () { slider.slider(config); },

            /** Returns the minimum slider value. */
            getMin: function () { return config.min; },

            /** Returns the maximum slider value. */
            getMax: function () { return config.max; },

            /** Sets the low end of the slider range.
             *
             * @param {number} min The new value.
             */
            setMin: function (min) { config.min = min; slider.slider(config); },

            /** Sets the high end of the slider range.
             *
             * @param {number} max The new value.
             */
            setMax: function (max) { config.max = max; slider.slider(config); },

            /** Sets the low-end slider value.
             *
             * @param {number} v The new value.
             */
            setLowValue: function (v) { slider.slider("values", [v, slider.slider("values")[1]]); },

            /** Sets the high-end slider value.
             *
             * @param {number} v The new value.
             */
            setHighValue: function (v) { slider.slider("values", [slider.slider("values")[0], v]); },

            /** Returns an array of two values indicating the current slider
             * values. */
            getValue: function () { return slider.slider("values"); }
        };
    };
}());
