/*jslint */

/*global tangelo */

/**
 * @fileOverview Provides a few utility functions dealing with dates - in
 * particular, an abbreviated toString() method.
 */

(function () {
    "use strict";

    var mod,
        month_names,
        day_names,
        toShortString;

    /**
     * @name date
     * @memberOf tangelo
     *
     * @namespace Some utilities for dealing with Date objects and dates in
     * general.
     */
    mod = tangelo.namespace("date");

    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    day_names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    /** Returns an array of abbreviated month names.
     *
     * @name monthNames
     *
     * @memberOf tangelo.date
     *
     * @function
     *
     * @returns {string} The array of names.
     */
    mod.monthNames = function () {
        return month_names.slice();
    };

    /** Returns an array of abbreviated day names.
     *
     * @name dayNames
     * @memberOf tangelo.date
     * @function
     *
     * @returns {Array} The array of names.
     */
    mod.dayNames = function () {
        return day_names.slice();
    };

    /** Formats a date in the form "Oct 30, 1981 (05:31:00)"
     *
     * @name toShortString
     * @memberOf tangelo.date
     * @function
     *
     * @param {Date} d The date to format.
     *
     * @return {string} The string representation of the date.
     */
    mod.toShortString = function (d) {
        var day,
            month,
            year,
            hour,
            minute,
            second;

        // Grab the date.
        day = d.getDate();
        month = d.getMonth();
        year = d.getFullYear();

        // Grab the time.
        hour = d.getHours();
        minute = d.getMinutes();
        second = d.getSeconds();

        // Pad the time components with a zero if they are smaller than 10.
        if (hour < 10) { hour = "0" + hour; }
        if (minute < 10) { minute = "0" + minute; }
        if (second < 10) { second = "0" + second; }

        return month_names[month] + " " + day + ", " + year + " (" + hour + ":" + minute + ":" + second + ")";
    };

    Date.prototype.toString = function () {
        return tangelo.date.toShortString(this);
    };

    Date.prototype.getMonthName = function () {
        return month_names[this.getMonth()];
    };

    Date.prototype.getDayName = function () {
        return day_names[this.getDay()];
    };

    mod.displayDate = function (d) {
        return mod.monthNames()[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
    };
}());
