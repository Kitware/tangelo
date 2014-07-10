window.onload = function () {
    var data, N = 50, rand = d3.random.normal();

    function generate() {
        var i;
        data = [];
        for (i = 0; i < N; i += 1) {
            data.push({value: rand()});
        }
    }

    function draw(transition) {
        transition = Number.isFinite(transition) ? transition : 0;
        $("#content1").histogram({
            data: data,
            x: {'field': 'value'},
            transition: transition,
            margin: {
                left: 35,
                right: 20,
                top: 10,
                bottom: 35
            }
        });

        d3.selectAll(".plot .boxes").on('mouseover', function () {
            d3.select(this).classed('mouseover', true);
        })
        .on('mouseout', function () {
            d3.select(this).classed('mouseover', false);
        });
    }
    
    generate();
    draw();
    $(window).resize(draw);
    $('#next').click(function () {
        generate();
        draw(500);
    });
};
