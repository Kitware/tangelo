/*jslint */

var date = {};
date.month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
date.day_names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

date.toShortString = function (d) {
    "use strict";

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

    return date.month_names[month] + " " + day + ", " + year + " (" + hour + ":" + minute + ":" + second + ")";
};

Date.prototype.toString = function () {
    "use strict";

    return date.toShortString(this);
};

Date.prototype.getMonthName = function () {
    "use strict";

    return date.month_names[this.getMonth()];
};

Date.prototype.getDayName = function () {
    "use strict";

    return date.day_names[this.getDay()];
};
