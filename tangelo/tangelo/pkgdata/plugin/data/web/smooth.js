/*
 * Defines a general 1D convolution smoother for tangelo.
 *
 * The code computes an in place convolution of a data array
 * with a kernel:
 *
 *   value[i] = \sum_{j=1,N} y(data[j]) * kernel(x(data[i]), x(data[j]))
 *
 * input:
 *   spec {
 *     data: the data array
 *     x: accessor to the x coordinate (default {"field": "x"})
 *     y: accessor to the y coordinate (default {"field": "y"})
 *     set: setter for the y coordinate
 *          function (value, d, i) {...}
 *              set the y property of d to value
 *              this is set to the data array
 *              i is the global index
 *          (only needed for mutating the data array,
 *          smoothed values are always returned)
 *     kernel: "box", "gaussian", or a custom kernel function
 *     radius: the bandwidth of the convolution
 *     absolute: whether the radius is specified in absolute or
 *               relative coordinates
 *     sorted: whether the input data is sorted by x or not
 *     normalize: whether or not to normalize the kernel to sum to 1
 *   }
 * output:
 *   values array of smoothed data, in addition the spec.data is mutated
 *   if spec.set was defined
 *
 * WARNING: This performs a naive convolution with n^2 performance for large
 *          kernel radii.  Should replace with an FFT implementation in the
 *          future.
 */

(function (tangelo) {
    "use strict";

    var dataPlugin,
        kernels;

    dataPlugin = tangelo.getPlugin("data");

    // predefined kernels
    kernels = {
            // simple moving average
            box: function () {
                return function boxKernel() {
                    return 1;
                };
            },
            // gaussian kernel with sigma = radius / 3
            gaussian: function (radius) {
                var sigma = radius / 3,
                    c = 1.0 / (sigma * Math.sqrt(2.0 * Math.PI)),
                    s2 = sigma * sigma;
                return function (xi, xj) {
                    var x = xi - xj;
                    return c * Math.exp(-0.5 * x * x / s2);
                };
            }
        };

    dataPlugin.smooth = function (spec) {
        var x = tangelo.accessor(spec.x || {field: "x"}),
            y = tangelo.accessor(spec.y || {field: "y"}),
            set = spec.set,
            kernel = spec.kernel || "box",
            radius = spec.radius !== undefined ? spec.radius : 0.05,
            absolute = spec.absolute !== undefined ? spec.absolute : false,
            sorted = spec.sorted !== undefined ? spec.sorted : true,
            normalize = spec.normalize !== undefined ? spec.normalize : true,
            data = spec.data || [],
            N = data.length,
            copy, i, iStart, j, xi, xj, yi, yj, w, wSum = [], values = [];

        // preallocate values array
        values.length = N;

        // if data is empty do nothing
        if (N === 0) {
            return [];
        }

        // sort the data if needed
        if (!sorted) {
            data.sort(function (a, b) {
                return x(a) - x(b);
            });
        }

        // if the radius is not absolute compute the absolute radius
        // from the extent of the data
        if (!absolute) {
            w = x(data[N - 1]) - x(data[0]);
            if (w < 0) {
                throw new Error("Unsorted input detected.  Try spec.sorted=false");
            }
            radius = radius * w;
        }

        // get the predefined kernel if the kernel option is a string
        if (typeof kernel === "string") {
            kernel = kernels[kernel](radius);
            if (!kernel) {
                throw new Error("Unknown kernel '" + kernel + "'");
            }
        }

        // if radius is negative no smoothing is done
        // just set values array and return
        if (radius < 0) {
            data.forEach(function (d, i) {
                values[i] = y(d);
                if (set) {
                    set.call(data, y(d), d, i);
                }
            });
            return values;
        }

        // create a copy of the data
        copy = [];
        copy.length = N;
        data.forEach(function (d, i) {
            copy[i] = y(d);
            wSum.push(0);
        });

        // initialize a rolling start index for convolution
        iStart = 0;

        // loop over all data
        for (i = 0; i < N; i++) {
            // get the x value and initialize convolution value
            xi = x(data[i]);
            yi = 0;

            // loop over data inside convolution radius
            for (j = iStart; j < N; j++) {
                // get the x and y values at j
                xj = x(data[j]);
                yj = copy[j];

                if (xj > xi + radius) {
                    // we have finished the local convolution
                    break;
                }
                if (xj < xi - radius) {
                    // istart was too small
                    // update rolling start index
                    iStart = j + 1;
                } else {
                    // compute the kernel and update
                    w = kernel.call(data, xi, xj, i, j);
                    wSum[j] += w;
                    yi += w * yj;
                }
            }

            // set output array
            values[i] = yi;
        }

        for (i = 0; i < N; i += 1) {
            yi = values[i];

            // normalize the kernel if requested
            if (normalize) {
                yi = yi/wSum[i];
                values[i] = yi;
            }

            // mutate the data array if a set method was provided
            if (set) {
                set.call(data, yi, data[i], i);
            }
        }

        return values;
    };
}(window.tangelo));
