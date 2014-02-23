/*globals describe, it, expect, tangelo */

describe('tangelo.data.distanceCluster', function () {
    'use strict';
    

    // boilerplate for generating random points
    var defaultRange = [0, 100];

    function makeRandom(range) {
        return Math.random() * (range[1] - range[0]) - range[0];
    }

    function makeRandomPoint(mkRand) {
        mkRand = mkRand || function () { return makeRandom(defaultRange); };
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
    
    function checkCluster(cluster, singlet, spec) {
        expect(Array.isArray(cluster)).toBe(true);
        cluster.forEach(function (c) {
            expect(Array.isArray(c)).toBe(true);
            expect(c.length).toBeGreaterThan(1);
            c.forEach(function (d) {
                // check in place structure of data
                expect(c).toBe(d.cluster);
                c.forEach(function (e) {
                    // check that all elements in clusters are within 2 times the cluster radius
                    expect(spec.metric(d, e)).toBeLessThan(spec.clusterDistance*2);
                });
            });
        });
        cluster.forEach(function (d) {
            expect(d.center).not.toThrow();
            cluster.forEach(function (e) {
                // check that all clusters are at least one cluster radius apart
                if (d !== e) {
                    expect(spec.metric(d.center(), e.center())).toBeGreaterThan(spec.clusterDistance);
                }
            });
            singlet.forEach(function (e) {
                // check that all singlets are one cluster radius apart from all clusters
                expect(spec.metric(d.center(), e)).toBeGreaterThan(spec.clusterDistance);
            });
        });
        
        expect(Array.isArray(singlet)).toBe(true);
        singlet.forEach(function (d) {
            expect(d).toBeDefined();
            expect(d.cluster).toBeDefined();
            expect(d.cluster.length).toBe(1);
            singlet.forEach(function (e) {
                // check that all singlets are one cluster radius apart
                if (d !== e) {
                    expect(spec.metric(d, e)).toBeGreaterThan(spec.clusterDistance);
                }
            });
        });
    }
    
    // main test runner
    function testRandomDefault(N, spec) {
        spec = spec || {};
        function metric(a, b) {
            var x = a.x - b.x,
                y = a.y - b.y;
            return Math.sqrt(x*x + y*y);
        }

        it('Testing a random dataset of size ' + N, function () {
            spec.clusterDistance = spec.clusterDistance || 10;
            spec.data = makeRandomData(N);
            
            var obj = tangelo.data.distanceCluster(spec);
            
            spec.metric = spec.metric || metric;
            checkCluster(obj.clusters, obj.singlets, spec);
        });
    }
   
    // generate test cases
    describe('Default metric', function () {
        testRandomDefault(10);
        testRandomDefault(100);
        testRandomDefault(1000);
    });
    
    describe('Custom metrics', function () {
        var spec = {
            clusterDistance: 15,
            metric: function (a, b) {
                return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
            }
        };
        testRandomDefault(10, spec);
        testRandomDefault(100, spec);
        testRandomDefault(1000, spec);
        
        it('Degenerate metric', function () {
            // degenerate metric
            spec.data = makeRandomData(100);
            spec.metric = function () {
                return 0;
            };
            var obj = tangelo.data.distanceCluster(spec);
            expect(obj.clusters.length).toBe(1);
            expect(obj.singlets.length).toBe(0);
        });
        
        it('Discrete metric', function () {
            // degenerate metric
            spec.data = makeRandomData(100);
            spec.metric = function () {
                return 100;
            };
            var obj = tangelo.data.distanceCluster(spec);
            expect(obj.clusters.length).toBe(0);
            expect(obj.singlets.length).toBe(spec.data.length);
        });
    });

    describe('Custom accessors', function () {
        it('Array like data', function () {
            var spec = {
                data: makeRandomData(100).map(function (d) {
                    return [d.x, d.y];
                }),
                x: function (d) { return d[0]; },
                y: function (d) { return d[1]; },
                clusterDistance: 15
            };
            var obj = tangelo.data.distanceCluster(spec);
            
            spec.metric = function (a, b) {
                var x = a[0] - b[0],
                    y = a[1] - b[1];
                return Math.sqrt(x*x + y*y);
            };
            checkCluster(obj.clusters, obj.singlets, spec);
        });
        it('Nested data', function () {
            var spec = {
                data: makeRandomData(100).map(function (d) {
                    return { loc: d };
                }),
                x: function (d) { return d.loc.x; },
                y: function (d) { return d.loc.y; },
                clusterDistance: 15
            };
            var obj = tangelo.data.distanceCluster(spec);
            
            spec.metric = function (a, b) {
                var x = a.loc.x - b.loc.x,
                    y = a.loc.y - b.loc.y;
                return Math.sqrt(x*x + y*y);
            };
            checkCluster(obj.clusters, obj.singlets, spec);
        });
    });
});
