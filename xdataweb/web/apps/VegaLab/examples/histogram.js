{
    data: function(){
        return { values: [{bin: 0, value: 0.1},
                          {bin: 1, value: 0.2},
                          {bin: 2, value: 0.3},
                          {bin: 3, value: 0.4},
                          {bin: 4, value: 0.5}] };
    },

    extra: function(vis){
        console.log(vis);
    }
}
