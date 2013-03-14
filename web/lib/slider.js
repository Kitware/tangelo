/*jslint */

/*globals tangelo, $ */

/**
 * @fileOverview This file supplies the interface for creating and managing
 * jQuery UI slider elements.
 */

(function () {
    "use strict";

    /**
     * @name slider
     * @memberOf tangelo
     *
     * @namespace Classes for creating and controlling jQuery slider elements.
     */
    var mod = tangelo.namespace("slider");

    /**
     * @name slider
     * @memberOf tangelo.slider
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
        onchange = callbacks && callbacks.onchange;
        onslide = callbacks && callbacks.onslide;

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
         * @lends tangelo.slider.slider.prototype
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

            /** Sets the current slider value.
             *
             * @param {v} The new value.
             */
            setValue: function (v) { s.slider("value", v); },

            /** Returns the current slider value.
             *
             * @returns {number} The current slider value.
             */
            getValue: function () { return s.slider("value"); }
        };
    };

    /**
     * @name tangelo.slider.rangeSlider
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
            enabled,
            config;

        // Make the slider element into a jQuery selection.
        slider = $(sliderelem);

        // Capture the two callbacks (if these were not specified, they will be
        // captured as "undefined") and place them in a registry of callbacks.
        // Also set the callbacks as being active.
        callbacks = {
            onchange: {
                code: callbacks && callbacks.onchange,
                enabled: true
            },

            onslide: {
                code: callbacks && callbacks.onslide,
                enabled: true
            }
        };

        // Set up a basic configuration that simply calls the user-supplied
        // callbacks.
        config = {
            range: true,

            /** @ignore */
            change: function (e, ui) {
                if (callbacks.onchange.code && callbacks.onchange.enabled) {
                    callbacks.onchange.code(ui.values[0], ui.values[1]);
                }
            },

            /** @ignore */
            slide: function (e, ui) {
                if (callbacks.onslide.code && callbacks.onslide.enabled) {
                    callbacks.onslide.code(ui.values[0], ui.values[1]);
                }
            }
        };

        // Return the user an interface object.
        /**
         * @lends tangelo.slider.rangeSlider.prototype
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
            getValue: function () { return slider.slider("values"); },

            /** Sets the callbacks individually.
             *
             * @param {String} callback Which callback to set.
             *
             * @param {Function} code The function to use as the callback.
             *
             * @returns {boolean} Whether the callback name was valid or not.
             */
            setCallback: function (callback, code) {
                var good;

                good = callbacks.hasOwnProperty(callback);
                if (good) {
                    callbacks[callback].code = code;
                }

                return good;
            },

            /** Enable/disable the installed callbacks.
             *
             * @param {boolean} on Whether the callbacks should be active or
             * not.
             */
            enableCallbacks: function (on) {
                var c;

                for (c in callbacks) {
                    if (callbacks.hasOwnProperty(c)) {
                        callbacks[c].enabled = on;
                    }
                }

                slider.slider(config);
            },

            /** Enable/disable particular callbacks by name.
             *
             * @param {String} callback The name of the callback to
             * enable/disable.
             *
             * @param {boolean} on Whether to enable or disable the callback.
             *
             * @returns {boolean} Whether the callback name was valid or not.
             */
            enableCallback: function (callback, on) {
                var good;

                // Go ahead and make the change if the callback name is actually
                // in the registry.
                good = callbacks.hasOwnProperty(callback);
                if (good) {
                    callbacks[callback].enabled = on;
                    slider.slider(config);
                }

                // Report whether the callback name was valid or not.
                return good;
            }

        };
    };
}());
