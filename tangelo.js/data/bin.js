/*jslint browser: true, nomen: true, unparam: true*/

(function (tangelo) {
    'use strict';

    function makeBins(data, value, min, max, nBins) {

        var _min = Number.POSITIVE_INFINITY,
            _max = Number.NEGATIVE_INFINITY,
            bins = [],
            dx,
            i;

        // coerce values into numbers
        min = Number(min);
        max = Number(max);

        // create an array of bin objects
        if (!isFinite(min) || !isFinite(max)) {

            // we need to calculate data extent
            data.forEach(function (d) {
                var v = Number(value(d));
                if (!isFinite(v)) {
                    tangelo.error('Invalid numeric value in data array: ' + v.toString());
                } else {
                    if (v < _min) {
                        _min = v;
                    }
                    if (v > _max) {
                        _max = v;
                    }
                }
            });

            if (!isFinite(min)) {
                min = _min;
            }
            if (!isFinite(max)) {
                max = _max;
            }
        }

        // degenerate case with only one value
        if (max === min) {
            min = min - 0.5;
            max = max + 0.5;
        }

        // calculate bin width
        dx = (max - min) / nBins;

        // generate the bins
        for (i = 0; i < nBins; i += 1) {
            bins.push({
                min: min + i * dx,
                max: min + (i + 1) * dx,
                count: 0
            });
        }

        return bins;
    }

    tangelo.data.bin = function (spec) {
        var maxBinValue;

        spec = spec || {};
        spec.data = spec.data || [];
        spec.nBins = spec.nBins || 25;
        spec.value = tangelo.accessor(spec.value || {'field': 'value'});

        if (!spec.data.length) {
            // there's no data, we can't do anything
            return [];
        }

        // create the bins if they aren't given by the user
        if (!spec.bins) {
            spec.bins = makeBins(spec.data, spec.value, spec.min, spec.max, spec.nBins);
        }

        // get the maximum value in the bins to account for the special
        // case when the data value is on the right edge
        maxBinValue = Number.NEGATIVE_INFINITY;
        spec.bins.forEach(function (b) {
            maxBinValue = Math.max(maxBinValue, b.max);
        });

        // bin the data
        spec.data.forEach(function (d) {
            var v = Number(spec.value(d));
            if (!isFinite(v)) {
                tangelo.error('Invalid numeric value in data array: ' + v.toString());
            }

            // loop through the bins to find where the data belongs
            spec.bins.forEach(function (b, iBin) {
                // this statement adds the value to the bin if
                //   1. it is in [b.min, b.max) or
                //   2. it is the largest bin and in [b.min, b.max].
                if (b.min <= v && (b.max > v || (b.max === maxBinValue && b.max === v))) {
                    b.count = (b.count || 0) + 1;
                }
            });
        });

        return spec.bins;
    };

}(window.tangelo));
