function(){
    var dat = [];
    for(var i=0; i<5; i++){
        var o = { bin : i,
                  value : (i+1)*0.1,
                  state : "unselected" };
        dat.push(o);
    }

    return { values: dat };
}
