/*
 * Defines a data clustering algorithm for tangelo based on
 * the maximum distance from the cluster center.
 *
 * By default, clusters according to the standard euclidean
 * metric in R^2, but arbitrary topologies are possible by
 * providing a custom metric function.  The data is modified
 * in place by adding a cluster attribute to all data elements.
 * The cluster attribute is an array containing all data elements
 * in the local cluster.
 *
 * Required input:
 *
 * spec.data [Array of objects]: The data to be clustered
 *
 * Optional input:
 *
 * spec.clusterDistance [Number]: Maximum clustering radius (default 20)
 * spec.x [Function (d) -> R],
 * spec.y [Function (d) -> R]: Returns the x/y-coordinate of a data
 *                             object for the default metric.
 * spec.metric [Function (d, d) -> R >= 0]: Returns the distance between two
 *                                          objects
 *
 *
 * Basic usage example:
 *
 * data = [
 *     { x: 0,  y: 0  },
 *     { x: 1,  y: 1  },
 *     { x: 2,  y: 0  },
 *     { x: 10, y: 0  },
 *     { x: 11, y: 2  },
 *     { x: 20, y: 10 }
 * ];
 *
 *  spec = {
 *      data: data,
 *      clusterDistance: 5
 *  };
 *
 *  obj = tangelo.data.cluster(spec);
 *
 *  obj.clusters => [ [ { x: 0, y: 0 }, ... ], [ { x: 10, y: 0}, ... ] ]
 *  obj.singlets => [ { x: 20, y: 10 } ]
 *
 *  For more examples, see testing/js-unit-tests/cluster.js in tangelo source.
 */

(function (tangelo, _) {
    "use strict";

    var dataPlugin = tangelo.getPlugin("data");

    // default metric: 2D euclidean metric
    function defaultMetric(xAcc, yAcc) {
        return function (a, b) {
            var ax = xAcc(a),
                ay = yAcc(a),
                bx = xAcc(b),
                by = yAcc(b),
                x = (ax - bx),
                y = (ay - by);
            return Math.sqrt(x * x + y * y);
        };
    }

    // generate a new cluster (just an array with a function that returns the
    // cluster center)
    function createNewCluster() {
        var c = [];
        c.center = function () {
            return c[0];
        };
        c.id = _.uniqueId();

        // add tree-like structure to support possible heirachical clustering
        c.children = [];
        return c;
    }

    // main clustering function
    function cluster(spec) {
        // extract components from the argument using defaults if unspecified
        var xAcc,
            yAcc,
            metric,
            data,
            dist,
            clusters = [],
            c = [],
            i,
            j,
            added,
            singlets = [],
            groups = [];

        spec = spec || {};

        xAcc = spec.x || tangelo.accessor({field: "x"});
        yAcc = spec.y || tangelo.accessor({field: "y"});
        metric = spec.metric || defaultMetric(xAcc, yAcc);
        dist = spec.clusterDistance || 20;
        data = spec.data || [];

        // Here we provide a way to short circuit the clustering algorithm by
        // providing a negative distance.  Return all data as singlets.
        if (dist < 0) {
            return {
                singlets: data.slice(),
                clusters: []
            };
        }

        // loop over all data elements
        for (i = 0; i < data.length; i += 1) {
            added = false;

            // loop over all clusters
            for (j = 0; j < clusters.length; j += 1) {
                c = clusters[j];

                // if this cluster is within the clustering distance add the element
                if (metric(data[i], c.center()) < dist) {
                    c.push(data[i]);
                    added = true;
                    break;
                }
            }

            // if no cluster was found, generate a new one
            if (!added) {
                c = createNewCluster();
                c.push(data[i]);
                clusters.push(c);
            }
        }

        // remove all clusters with only one element and add them to the
        // singlets array
        clusters.forEach(function (d) {
            if (d.length === 1) {
                d[0].cluster = d;
                singlets.push(d[0]);
            } else {
                d.forEach(function (e) {
                    e.cluster = d;
                });
                groups.push(d);
            }
        });

        return {
            singlets: singlets,
            clusters: groups
        };
    }

    dataPlugin.distanceCluster = cluster;
}(window.tangelo, window._));
