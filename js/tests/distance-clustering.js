QUnit.module("tangelo.plugin.data.distanceCluster()");

(function (_) {
    "use strict";

    // boilerplate for generating random points
    var defaultRange = [0, 100];

    function makeRandom(range) {
        return Math.random() * (range[1] - range[0]) - range[0];
    }

    function makeRandomPoint(mkRand) {
        mkRand = mkRand || function () {
            return makeRandom(defaultRange);
        };
        return {
            x: mkRand(),
            y: mkRand()
        };
    }

    function makeRandomData(N, rndPt, mkRand) {
        rndPt = rndPt || makeRandomPoint;
        var i, data = [];
        for (i = 0; i < N; i++) {
            data.push(rndPt(mkRand));
        }
        return data;
    }

    function checkCluster(assert, cluster, singlet, spec) {
        assert.ok(_.isArray(cluster));
        cluster.forEach(function (c) {
            assert.ok(_.isArray(c));
            assert.ok(c.length > 1);
            c.forEach(function (d) {
                // check in place structure of data
                assert.strictEqual(c, d.cluster);
                c.forEach(function (e) {
                    // check that all elements in clusters are within 2 times the cluster radius
                    assert.ok(spec.metric(d, e) < spec.clusterDistance*2);
                });
            });
        });
        cluster.forEach(function (d) {
            try {
                d.center();
                assert.ok(true);
            } catch (e) {
                assert.ok(false);
            }

            cluster.forEach(function (e) {
                // check that all clusters are at least one cluster radius apart
                if (d !== e) {
                    assert.ok(spec.metric(d.center(), e.center()) > spec.clusterDistance);
                }
            });
            singlet.forEach(function (e) {
                // check that all singlets are one cluster radius apart from all clusters
                assert.ok(spec.metric(d.center(), e) > spec.clusterDistance);
            });
        });

        assert.ok(_.isArray(singlet));
        singlet.forEach(function (d) {
            assert.notStrictEqual(d, undefined);
            assert.notStrictEqual(d.cluster, undefined);
            assert.strictEqual(d.cluster.length, 1);
            singlet.forEach(function (e) {
                // check that all singlets are one cluster radius apart
                if (d !== e) {
                    assert.ok(spec.metric(d, e) > spec.clusterDistance);
                }
            });
        });
    }

    // main test runner
    function testRandomDefault(N, spec) {
        var prefix = spec ? "Default metric" : "Custom metric";
        spec = spec || {};
        function metric(a, b) {
            var x = a.x - b.x,
                y = a.y - b.y;
            return Math.sqrt(x*x + y*y);
        }

        QUnit.test(prefix + " - testing a random dataset of size " + N, function (assert) {
            spec.clusterDistance = spec.clusterDistance || 10;
            spec.data = makeRandomData(N);

            var obj = tangelo.plugin.data.distanceCluster(spec);

            spec.metric = spec.metric || metric;
            checkCluster(assert, obj.clusters, obj.singlets, spec);
        });
    }

    // generate test cases
    testRandomDefault(10);
    testRandomDefault(100);
    // testRandomDefault(1000);

    var spec = {
        clusterDistance: 15,
        metric: function (a, b) {
            return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
        }
    };
    testRandomDefault(10, spec);
    testRandomDefault(100, spec);
    // testRandomDefault(1000, spec);

    QUnit.test("Degenerate metric", function (assert) {
        // degenerate metric
        spec.data = makeRandomData(100);
        spec.metric = function () {
            return 0;
        };
        var obj = tangelo.plugin.data.distanceCluster(spec);
        assert.strictEqual(obj.clusters.length, 1);
        assert.strictEqual(obj.singlets.length, 0);
    });

    QUnit.test("Discrete metric", function (assert) {
        // degenerate metric
        spec.data = makeRandomData(100);
        spec.metric = function () {
            return 100;
        };
        var obj = tangelo.plugin.data.distanceCluster(spec);
        assert.strictEqual(obj.clusters.length, 0);
        assert.strictEqual(obj.singlets.length, spec.data.length);
    });

    QUnit.test("Custom accessor - array like data", function (assert) {
        var spec,
            obj;

        spec = {
            data: makeRandomData(100).map(function (d) {
                return [d.x, d.y];
            }),
            x: function (d) {
                return d[0];
            },
            y: function (d) {
                return d[1];
            },
            clusterDistance: 15
        };
        obj = tangelo.plugin.data.distanceCluster(spec);

        spec.metric = function (a, b) {
            var x = a[0] - b[0],
                y = a[1] - b[1];
            return Math.sqrt(x*x + y*y);
        };
        checkCluster(assert, obj.clusters, obj.singlets, spec);
    });

    QUnit.test("Custom accessor - nested data", function (assert) {
        var spec,
            obj;

        spec = {
            data: makeRandomData(100).map(function (d) {
                return { loc: d };
            }),
            x: function (d) {
                return d.loc.x;
            },
            y: function (d) {
                return d.loc.y;
            },
            clusterDistance: 15
        };
        obj = tangelo.plugin.data.distanceCluster(spec);

        spec.metric = function (a, b) {
            var x = a.loc.x - b.loc.x,
                y = a.loc.y - b.loc.y;
            return Math.sqrt(x*x + y*y);
        };
        checkCluster(assert, obj.clusters, obj.singlets, spec);
    });
}(window._));
