window.onload = function () {
    var n = 1000, data = [], i, 
        start = new Date(2010, 0, 1),
        end = new Date(2010, 11, 31),
        deltaTime = (end - start)/(n - 1),
        spec = {
            data: data,
            sorted: true,
            x: {'field': 'time'},
            y: {'field': 'origValue'}
        },
        iRadius = 0,
        radii = [ 0.01, 0.05, 0.10, 0.15, 0.20, 0.25 ];

    function generate() {
        for (i = 0; i < n; i += 1) {
            data[i] = {
                time: i * deltaTime + start.valueOf(),
                origValue: Math.random()
            };
        }
    }
   
    function smooth(radius) {
        $('#textBox').text('Smoothing radius: ' + (radius * 100).toFixed() + '%');
        tangelo.data.smooth(
            $.extend({
                radius: radius,
                kernel: 'box',
                set: function (v, d) { d.value1 = v; }
            }, spec)
        );
        tangelo.data.smooth(
            $.extend({
                radius: radius,
                kernel: 'gaussian',
                set: function (v, d) { d.value2 = v; }
            }, spec)
        );
    }
    
    function draw(transition) {
        $("#content1").timeline({
            data: data,
            y: {field: 'value1'},
            transition: transition
        });
        $("#content2").timeline({
            data: data,
            y: {field: 'value2'},
            transition: transition
        });
    }
    
    generate();
    smooth(radii[iRadius]);
    draw();
    $(window).resize(draw);
    $('#next').click(function () {
        var t = 500;
        iRadius = (iRadius + 1) % radii.length;
        if (iRadius === 0) {
            generate();
            t = 0;
        }
        smooth(radii[iRadius]);
        draw(t);
    });
};
