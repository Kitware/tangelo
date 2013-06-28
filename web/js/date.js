/*global tangelo */

(function () {
    "use strict";

    var month_names,
        day_names;

    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    day_names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    tangelo.monthNames = function () {
        return month_names.slice();
    };

    tangelo.dayNames = function () {
        return day_names.slice();
    };

    // Date handling functions go in this submodule.
    tangelo.date = {};

    // Formats a date in the form "Oct 30, 1981 (05:31:00)"
    tangelo.date.toShortString = function (d) {
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

    // Returns the shortened month name for a given Date object.
    tangelo.date.getMonthName = function (d) {
        return month_names[d.getMonth()];
    };

    // Returns the shortened day name for a given Date object.
    tangelo.date.getDayName = function (d) {
        return day_names[d.getDay()];
    };

    // Formats a date in the form "Oct 30, 1981"
    tangelo.date.displayDate = function (d) {
        return tangelo.monthNames()[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
    };
}());
