var titles = new Array(bins);
var format = d3.format('%');
var data = <<DATA>>;
for(var i=0; i<bins; i++){
    titles[i] = format(i/bins) + ' - ' + format((i+1)/bins) + ' (' + format(data[i].value) + ' or ' + data[i].count + ' records)';
}
var containers = dom.select('.mark-1').selectAll('rect');
containers.data(titles).append('title').text(function(d) { return d; });

containers.on('mouseover', function(d, i){
    d3.select(this).style('opacity',0.3);
    if(stats.dragging.on){
        var target = -1;
        if(i < stats.dragging.left){
            // Dragging outside the pack, to the left.
            for(var j=i; j<stats.dragging.left; j++){
                var e = d3.select(containers[0][j]);
                e.style('opacity', 0.3);
            }
            stats.dragging.left = i;
            stats.dragging.from = 0;
        }
        else if(i > stats.dragging.right){
            // Dragging outside the pack, to the right.
            for(var j=stats.dragging.right+1; j<i; j++){
                var e = d3.select(containers[0][j]);
                e.style('opacity', 0.3);
            }
            stats.dragging.right = i;
            stats.dragging.from = 1;
        }
        else{
            // Dragging inside the pack.
            if(stats.dragging.from === 0){
                for(var j=stats.dragging.left; j<i; j++){
                    var e = d3.select(containers[0][j]);
                    e.style('opacity', 0.0);
                }
                stats.dragging.left = i;
            }
            else if(stats.dragging.from === 1){
                for(var j=i+1; j<=stats.dragging.right; j++){
                    var e = d3.select(containers[0][j]);
                    e.style('opacity', 0.0);
                }
                stats.dragging.right = i;
            }
            else{
                console.log("error - stats.dragging.from must be 0 or 1");
                throw 0;
            }
        }
    }
});

containers.on('mouseout', function(){
    if(!stats.dragging.on){
        d3.select(this).style('opacity',0.0);
    }
});

function mousedown(d, i){
    console.log("click: " + i);
    stats.dragging.on = true;
    stats.dragging.left = stats.dragging.right = i;
}

function mouseup(d, i){
    console.log("unclick: " + i);
    stats.dragging.on = false;
    console.log("selected range: " + stats.dragging.left + " -> " + stats.dragging.right);
}

containers.on('mousedown', mousedown);
containers.on('mouseup', mouseup);
