function(){
    var dat = [];
    for(var i=0; i<100; i++){
        var o = { bin : i,
                  value : Math.sin((i+1)*0.01*Math.PI),
                  state : "unselected" };
        dat.push(o);
    }

    return { values: dat };
}
