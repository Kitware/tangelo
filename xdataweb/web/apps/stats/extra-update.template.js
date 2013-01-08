var bardata = new Array(bins);
var format = d3.format('%');
var data = <<DATA>>;
for(var i=0; i<bins; i++){
    bardata[i] = {};
    bardata[i].title = format(i/bins) + ' - ' + format((i+1)/bins) + ' (' + format(data[i].value) + ' or ' + data[i].count + ' records)';
    bardata[i].state = 'unselected';
}
var containers = dom.select('.mark-1').selectAll('rect');
containers.data(bardata).append('title').text(function(d) { return d.title; });

containers.on('mouseover', function(d, i){
    var select = function(d){
        d.state = 'selected';
        return d;
    };

    var unselect = function(d){
        d.state = 'unselected';
        return d;
    };

    var bar = d3.select(this);
    if(d.state == 'selected'){
        bar.style('fill', 'red')
            .style('opacity', 0.5);
    }
    else if(d.state == 'unselected'){
        bar.style('fill', 'black')
            .style('opacity',0.3);
    }
    else{
        console.log("d.state must be selected or unselected - was " + d.state);
        throw 0;
    }

    if(stats.dragging.on){
        var target = -1;
        if(i < stats.dragging.left){
            // Dragging outside the pack, to the left.
            for(var j=i; j<stats.dragging.left; j++){
                var e = d3.select(containers[0][j]);
                e.style('opacity', 0.3)
                    .style('fill', 'red')
                    .datum(select);
            }
            stats.dragging.left = i;
            stats.dragging.from = 0;
        }
        else if(i > stats.dragging.right){
            // Dragging outside the pack, to the right.
            for(var j=stats.dragging.right+1; j<=i; j++){
                var e = d3.select(containers[0][j]);
                e.style('opacity', 0.3)
                    .style('fill', 'red')
                    .datum(select);
            }
            stats.dragging.right = i;
            stats.dragging.from = 1;
        }
        else{
            // Dragging inside the pack.
            if(stats.dragging.from === 0){
                // Shrinking the selection from the left.
                for(var j=stats.dragging.left; j<i; j++){
                    var e = d3.select(containers[0][j]);
                    e.style('opacity', 0.0)
                        .style('fill', 'black')
                        .datum(unselect);
                }
                stats.dragging.left = i;
            }
            else if(stats.dragging.from === 1){
                // Shrinking the selection from the right.
                for(var j=i+1; j<=stats.dragging.right; j++){
                    var e = d3.select(containers[0][j]);
                    e.style('opacity', 0.0)
                        .style('fill', 'black')
                        .datum(unselect);
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

containers.on('mouseout', function(d){
    if(!stats.dragging.on){
        if(d.state === 'unselected'){
            d3.select(this).style('opacity',0.0);
        }
        else if(d.state === 'selected'){
            d3.select(this).style('opacity',0.3);
        }
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
