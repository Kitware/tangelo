{
    data: function(){
        return { values: [{bin: 0, value: 0.1, state: "unselected"},
                          {bin: 1, value: 0.2, state: "unselected"},
                          {bin: 2, value: 0.3, state: "unselected"},
                          {bin: 3, value: 0.4, state: "unselected"},
                          {bin: 4, value: 0.5, state: "unselected"}] };
    },

    extra: function(vis){
        // Add some useful state to the vis object (for use in the mouse
        // callbacks below).
        vis.dragging = {};
        vis.dragging.on = false;
        vis.dragging.last = [-1, -1];
        vis.dragging.from = -1;

        // A D3 selection representing the currently selected range.
        vis.selection = null;

        // For the "recompute" action (a middle click on the selection).
        vis.middle_clicking = false;

        // Select the invisible container bars, for use in the mouse callbacks.
        var bars = d3.select(vis.el()).select(".mark-1").selectAll("rect");

        // Utility function to mark a bar as being part of the growing
        // selection.
        var select = function(d){
            d.state = "selected";
            return d;
        }

        // Utility function to remove a bar from the selection.
        var unselect = function(d){
            d.state = "unselected";
            return d;
        }

        bars.on("mousedown.bars", function(d, i){
            // Ignore middle clicks.
            var e = d3.event;
            if(e.button === 1){
                return;
            }

            // Cancel any existing selection.
            if(vis.selection){
                vis.selection.on("mousedown.selection", null);
                vis.selection.on("mouseup.selection", null);
                vis.selection = null;
            }

            // Enable dragging mode.
            vis.dragging.on = true;
            vis.dragging.left = vis.dragging.right = i;
            vis.dragging.from = -1;

            // Mark all bars as being unselected.
            bars.style('opacity', 0.0)
                .datum(unselect);

            // Mark the *clicked* bar as selected.
            d3.select(bars[0][i])
                .style('fill', 'red')
                .style('opacity', 0.3)
                .datum(select);
        });

        bars.on("mouseup.bars", function (d, i){
            // Ignore middle clicks.
            var e = d3.event;
            if(e.button === 1){
                return;
            }

            // Turn off dragging mode.
            vis.dragging.on = false;

            // Select out the nodes in the selection.
            vis.selection = d3.selectAll(bars[0].slice(vis.dragging.left, vis.dragging.right+1));

            // Add a pair of mouseclick handlers to this selection - middle
            // clicking on it will trigger a "recomputation" of the histogram
            // over the selection.
            //
            // We can't make this a "click" listener, because in browsers
            // besides Chrome, a non-left button click does not generate a click
            // event.
            vis.selection.on("mousedown.selection", function(){
                var e = d3.event;
                if(e.button === 1){
                    vis.middle_clicking = true;
                }
            });

            vis.selection.on("mouseup.selection", function(){
                var e = d3.event;
                if(e.button === 1 && vis.middle_clicking){
                    vis.middle_clicking = false;

                    // TODO(choudhury): replace this with appropriate
                    // "recompute" code.
                    console.log("recompute: " + vis.dragging.left + " -> " + vis.dragging.right);
                }
            });
        });

        bars.on("mouseover", function(d, i){
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

        if(vis.dragging.on){
            var target = -1;
            if(i < vis.dragging.left){
                // Dragging outside the pack, to the left.
                for(var j=i; j<=vis.dragging.left; j++){
                    var e = d3.select(bars[0][j]);
                    e.style('opacity', 0.3)
                        .style('fill', 'red')
                        .datum(select);
                }
                vis.dragging.left = i;
                vis.dragging.from = 0;
            }
            else if(i > vis.dragging.right){
                // Dragging outside the pack, to the right.
                for(var j=vis.dragging.right+1; j<=i; j++){
                    var e = d3.select(bars[0][j]);
                    e.style('opacity', 0.3)
                        .style('fill', 'red')
                        .datum(select);
                }
                vis.dragging.right = i;
                vis.dragging.from = 1;
            }
            else{
                // Dragging inside the pack.
                if(vis.dragging.from === 0){
                    // Shrinking the selection from the left.
                    for(var j=vis.dragging.left; j<i; j++){
                        var e = d3.select(bars[0][j]);
                        e.style('opacity', 0.0)
                            .style('fill', 'black')
                            .datum(unselect);
                    }
                    vis.dragging.left = i;
                }
                else if(vis.dragging.from === 1){
                    // Shrinking the selection from the right.
                    for(var j=i+1; j<=vis.dragging.right; j++){
                        var e = d3.select(bars[0][j]);
                        e.style('opacity', 0.0)
                            .style('fill', 'black')
                            .datum(unselect);
                    }
                    vis.dragging.right = i;
                }
                else{
                    console.log("error - vis.dragging.from must be 0 or 1");
                    throw 0;
                }
            }
        }
        });

        bars.on('mouseout', function(d){
            if(!vis.dragging.on){
                if(d.state === 'unselected'){
                    d3.select(this).style('opacity',0.0);
                }
                else if(d.state === 'selected'){
                    d3.select(this).style('opacity',0.3);
                }
            }
        });
    }
}
