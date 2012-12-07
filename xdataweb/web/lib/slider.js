// Call this to create a single slider object within the element described by
// sliderId.
function sliderInit(sliderId, displayId, callback){
    var slider = $("#" + sliderId);
    var display = d3.select("#" + displayId);

    var config = {
        change: function(e, ui){
            if(callback){
                callback(ui.value);
            }
        },

        slide: function(e, ui){
            display.html(ui.value);
        }
    };

    return {
        setConfig: function() { slider.slider(config); },
        setMax: function(max) { config.max = max; },
        getValue: function() { return slider.slider("value"); }
    };
}

function rangeSliderInit(sliderId, lowDisplayId, highDisplayId, callback){
    var slider = $("#" + sliderId);
    var lowDisplay = d3.select("#" + lowDisplayId);
    var highDisplay = d3.select("#" + highDisplayId);

    var config = {
        range: true,
        change: function(e, ui){
            if(callback){
                callback(ui.values[0], ui.values[1]);
            }
        },

        slide: function(e, ui){
            lowDisplay.html(ui.values[0]);
            highDisplay.html(ui.values[1]);
        }
    };

    return {
        setConfig: function() { slider.slider(config); },
        setMin: function(min) { config.min = min; },
        setMax: function(max) { config.max = max; },
        getValue: function() { return slider.slider("values"); }
    };
}
