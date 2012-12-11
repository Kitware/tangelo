date = {};
date.month_names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

date.toShortString = function(d){
    // Grab the date.
    var day = d.getDate();
    var month = d.getMonth();
    var year = d.getFullYear();

    // Grab the time.
    var hour = d.getHours();
    var minute = d.getMinutes();
    var second = d.getSeconds();

    // Pad the time components with a zero if they are smaller than 10.
    if(hour < 10){ hour = "0" + hour; }
    if(minute < 10){ minute = "0" + minute; }
    if(second < 10){ second = "0" + second; }

    return date.month_names[month] + " " + day + ", " + year + " (" + hour + ":" + minute + ":" + second + ")";
}

Date.prototype.toString = function(){
    return date.toShortString(this);
}
