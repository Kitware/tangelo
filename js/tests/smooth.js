QUnit.module("tangelo.data.smooth()");

(function () {
    "use strict";

    function makeData(n, x, y, xf) {
        var i, data = [], d;
        xf = xf || function (j) {
            return j + Math.random();
        };
        x = x || "x";
        y = y || "y";
        data.length = n;
        for (i = 0; i < n; i++) {
            d = {};
            d[x] = xf(i);
            d[y] = Math.random();
            data[i] = d;
        }
        return data;
    }

    QUnit.test("Edge cases - empty data", function (assert) {
        assert.deepEqual(tangelo.data.smooth({}), []);
        assert.deepEqual(tangelo.data.smooth({data: []}), []);
    });

    QUnit.test("Edge cases - non positive radius", function (assert) {
        var data = makeData(10),
            values = [];
        data.forEach(function (d) {
            values.push(d.y);
        });
        tangelo.data.smooth({
            data: data,
            radius: -1
        }).forEach(function (d) {
            assert.ok(values.indexOf(d) >= 0);
        });
    });

    QUnit.test("Edge cases - test in place data mutation", function (assert) {
        var data = makeData(25),
            obj = {};
        tangelo.data.smooth({
            data: data,
            set: function (val, d, i) {
                this[i]._obj1 = obj;
                d._obj2 = obj;
            }
        });
        data.forEach(function (d) {
            assert.strictEqual(d._obj1, obj);
            assert.strictEqual(d._obj2, obj);
        });
    });

    QUnit.test("Edge cases - test degenerate data", function (assert) {
        var n = 25,
            data = makeData(n, null, null, function () {
                return 0;
            }),
            mean = 0,
            values;
        data.forEach(function (d) {
            mean += d.y;
        });
        mean = mean/n;
        values = tangelo.data.smooth({
            data: data,
            radius: 0
        });
        values.forEach(function (d) {
            assert.ok(Math.abs(d - mean) < 1e-10);
        });
    });

    QUnit.test("Edge cases - test sorting", function (assert) {
        var data = makeData(25),
            values = [];
        data.forEach(function (d) {
            values.push(d.y);
        });
        data.reverse();
        assert.deepEqual(tangelo.data.smooth({
            data: data,
            sorted: false,
            radius: 0
        }), values);
    });

    QUnit.test("Box kernel - large window", function (assert) {
        var n = 25,
            data = makeData(n),
            mean = 0;
        data.forEach(function (d) {
            mean += d.y;
        });
        mean = mean / n;
        tangelo.data.smooth({
            data: data,
            kernel: "box",
            radius: 10
        }).forEach(function (d) {
            assert.ok(Math.abs(d - mean) < 1e-10);
        });
    });

    QUnit.test("Box kernel - 3 element window", function (assert) {
        var n = 100,
            i,
            data = [];
        for (i = 0; i < n; i += 1) {
            data.push({
                x: i,
                y: i
            });
        }
        tangelo.data.smooth({
            data: data,
            kernel: "box",
            radius: 1.5,
            absolute: true
        }).forEach(function (d, i) {
            var v;
            if (i === 0) {
                v = 0.5;
            } else if (i === n - 1) {
                v = ( 2 * n - 3 ) / 2;
            } else {
                v = i;
            }
            assert.ok(Math.abs(d - v)/v < 1e-10);
        });
    });

    QUnit.test("Gaussian kernel - large window", function (assert) {
        var n = 25,
            data = makeData(n),
            mean = 0;
        data.forEach(function (d) {
            d.y += 1;
            mean += d.y;
        });
        mean = mean / n;
        tangelo.data.smooth({
            data: data,
            kernel: "gaussian",
            radius: 100
        }).forEach(function (d) {
            assert.ok(Math.abs(d - mean)/mean < 1e-4);
        });
    });

    QUnit.test("Gaussian kernel - single point", function (assert) {
        var n = 101,
            data = [],
            i,
            sigma = 1,
            c;

        for (i = 0; i < n; i++) {
            data.push({
                x: i,
                y: 0
            });
        }
        data[50].y = 1;
        tangelo.data.smooth({
            kernel: "gaussian",
            radius: sigma * 3,
            absolute: true,
            data: data,
            set: function (v, d) {
                d.y = v;
            }
        });
        c = data[50].y;
        data.forEach(function (d, i) {
            var v;
            if (i < 50 - sigma * 3 || i > 50 + sigma * 3) {
                assert.strictEqual(d.y, 0);
            } else {
                v = c * Math.exp(-0.5 * (d.x - 50) * (d.x - 50) / (sigma * sigma));
                assert.ok(Math.abs(v - d.y)/v < 1e-6);
            }
        });
    });

    QUnit.test("custom kernel", function (assert) {
        var radius = 5,
            alpha = radius/3,
            n = 101,
            data = [],
            i;

        function expKernel(xi, xj) {
            return Math.exp(-alpha * Math.abs(xi - xj));
        }

        for (i = 0; i < n; i += 1) {
            data.push({
                x: i,
                y: 0
            });
        }

        data[50].y = 1;

        tangelo.data.smooth({
            kernel: expKernel,
            radius: radius,
            absolute: true,
            data: data,
            set: function (v, d) {
                d.y = v;
            },
            normalize: false
        });

        data.forEach(function (d, i) {
            var v;
            if (i < 50 - radius || i > 50 + radius) {
                assert.strictEqual(d.y, 0);
            } else {
                v = expKernel(data[50].x, d.x);
                assert.ok(Math.abs(v - d.y)/v < 1e-10);
            }
        });
    });

    QUnit.test("custom accessors", function (assert) {
        var n = 10,
            data = makeData(n),
            xCount = 0, yCount = 0;

        tangelo.data.smooth({
            data: data,
            x: function (d) {
                xCount += 1;
                return d.x;
            },
            y: function (d) {
                yCount += 1;
                return d.y;
            }
        });
        assert.ok(xCount > n - 1);
        assert.ok(yCount > n - 1);
    });
}());
