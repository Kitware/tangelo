window.onload = function(){
    var options = {
        zoom: 3,
        center: new google.maps.LatLng(65.67, 95.17),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var node = d3.select("#map").node();
    var map = new google.maps.Map(node, options);
}
