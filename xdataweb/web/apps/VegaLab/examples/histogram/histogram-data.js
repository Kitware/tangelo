function(){
    var dat = [];
    for(var i=0; i<100; i++){
        var o = { bin : (i+1)/100,
                  value : 0.0,
                  state : "unselected" };
        dat.push(o);
    }

    return { values: dat };
}
