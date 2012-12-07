// Call this to create a single slider object within the element described by
// sliderId.
function slider(slider, callbacks){
    // Make DOM element into a jQuery selction.
    var slider = $(slider);

    // Capture the user-supplied callbacks (missing ones will be captures as
    // "undefined").
    var onchange = callbacks.onchange;
    var onslide = callbacks.onslide;

    // Set up a config that uses the user-supplied callbacks.
    var config = {
        change: function(e, ui){
            if(onchange){
                onchange(ui.value);
            }
        },

        slide: function(e, ui){
            //display.html(ui.value);
            if(onslide){
                onslide(ui.value);
            }
        }
    };

    // Return an interface object.
    return {
        initialize: function() { slider.slider(config); },
        setMin: function(min) { config.min = min; slider.slider(config); },
        setMax: function(max) { config.max = max; slider.slider(config); },
        getValue: function() { return slider.slider("value"); }
    };
}

function rangeSlider(slider, callbacks){
    // Make the slider element into a jQuery selection.
    var slider = $(slider);

    // Capture the two callbacks (if these were not specified, they will be
    // captured as "undefined").
    var onchange = callbacks.onchange;
    var onslide = callbacks.onslide;

    // Set up a basic configuration that simply calls the user-supplied
    // callbacks.
    var config = {
        range: true,

        change: function(e, ui){
            if(onchange){
                onchange(ui.values[0], ui.values[1]);
            }
        },

        slide: function(e, ui){
            if(onslide){
                onslide(ui.values[0], ui.values[1]);
            }
        }
    };

    // Return the user an interface object.
    return {
        initialize: function() { slider.slider(config); },
        setMin: function(min) { config.min = min; slider.slider(config); },
        setMax: function(max) { config.max = max; slider.slider(config); },
        getValue: function() { return slider.slider("values"); }
    };
}
