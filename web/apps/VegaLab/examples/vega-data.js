function(){
  var t1 = [1,2,3,4,10,7,8,0],
      t2 = [2,3,4,5,5,8,3,1], c = t1,
      br = [.5,1,1,1,2,1,1,0];

  var gen = function(s) {
      return function(d,i) {
          return {"a":i, "b":d, "k":i, "s":s, "c":"ABCD"[i%4] };
      };
  };

  return {
    table: t1.map(gen(0)),
    brush: br.map(gen(1)),
    layer: t1.map(gen(0)).concat(br.map(gen(1)))
  };
}
