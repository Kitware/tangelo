/*jslint browser: true*/
/*global d3, $, tangelo*/
window.onload = function () {
    var nData = 50,
        data = [],
        i,
        iStyle = 0,
        color1 = d3.scale.linear()
                    .domain([0,0.5,1])
                    .range(['red', 'white', 'blue']),
        color2 = d3.scale.linear()
                    .domain([0,1])
                    .range(['steelblue', 'white']);
    
    function generate() {
        for (i = 0; i < nData; i++) {
            data[i] = {
                r1: Math.random(),
                r2: Math.random(),
                r3: Math.random()
            };
        }
    }
    generate();

    function var1(d) {
        return d.r1;
    }
    var1.label = 'Variable 1';

    function var2(d) {
        return 0.7*d.r1 + 0.3*d.r2;
    }
    var2.label = 'Variable 2';

    function var3(d) {
        return 1 - d.r2;
    }
    var3.label = 'Variable 3';

    function var4(d) {
        return 0.4*d.r1 + 0.4*d.r2 + 0.2*d.r3;
    }
    var4.label = 'Variable 4';

    function var5(d) {
        return 1 - (0.9*d.r1 + 0.05*d.r2 + 0.05*d.r3);
    }
    var5.label = 'Variable 5';

    function c(d) {
        var v = (d.r1 + d.r2 + d.r3)/3.0;
        return iStyle % 2 ? color1(v) : color2((v <= 0.25) ? 0 : 1);
    }

    $("#content1").correlationPlot({
        variables: [
            var1,
            var2,
            var3,
            var4,
            var5
        ],
        data: data,
        color: tangelo.accessor(c),
        full: true
    }).trigger('draw');
    $("#content2").correlationPlot({
        variables: [
            var1,
            var2,
            var3,
            var4,
            var5
        ],
        data: data,
        color: tangelo.accessor(c),
        full: false
    }).trigger('draw');
    
    $(window).resize(function () {
        $("#content1").trigger('draw');
        $("#content2").trigger('draw');
    });

    var styles = [
            {
                variables: [
                    var1,
                    var2,
                    var3,
                    var4,
                    var5
                ],
                data: data
            },
            {
                variables: [
                    var2,
                    var3,
                    var4,
                    var5
                ],
                data: data
            },
            {
                variables: [
                    var1,
                    var2,
                    var3
                ],
                data: data
            }
        ];
    $(".content").click(function () {
        iStyle = (iStyle + 1) % styles.length;
        if (!iStyle) {
            generate();
        }
        $("#content1").correlationPlot(styles[iStyle]).trigger('draw');
        $("#content2").correlationPlot(styles[iStyle]).trigger('draw');
    });
};
