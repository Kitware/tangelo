/*jslint unparam: true*/
/*globals describe, it, expect, tangelo, beforeEach, jasmine */

describe('tangelo.data.bin', function () {
    'use strict';

    describe('bin array creation', function () {
        it('one bin', function () {
            var bins = tangelo.data.bin({
                data: [{'value': 0}, {'value': 1}],
                nBins: 1,
                value: {'field': 'value'}
            });
            expect(bins.length).toBe(1);
            expect(bins[0].min).toBeCloseTo(0, 8);
            expect(bins[0].max).toBeCloseTo(1, 8);
        });
        it('degenerate data', function () {
            var bins = tangelo.data.bin({
                data: [{'value': 0}, {'value': 0}],
                nBins: 1,
                value: {'field': 'value'}
            });

            expect(bins.length).toBe(1);
            expect(bins[0].min).toBeCloseTo(-0.5, 8);
            expect(bins[0].max).toBeCloseTo(0.5, 8);
        });
        it('two bins', function () {
            var bins = tangelo.data.bin({
                data: [{'value': 0}, {'value': 1}],
                nBins: 2,
                value: {'field': 'value'}
            });

            expect(bins.length).toBe(2);
            expect(bins[0].min).toBeCloseTo(0, 8);
            expect(bins[0].max).toBeCloseTo(0.5, 8);
            expect(bins[1].min).toBeCloseTo(0.5, 8);
            expect(bins[1].max).toBeCloseTo(1, 8);
        });
        it('default nBins', function () {
            var bins = tangelo.data.bin({
                data: [{'value': 0}, {'value': 0}],
                value: {'field': 'value'}
            });

            expect(bins.length).toBe(25);
        });
        it('no data', function () {
            var bins = tangelo.data.bin();
            expect(bins.length).toBe(0);
        });
        it('min/max given', function () {
            var bins = tangelo.data.bin({
                data: [{'value': 0}, {'value': 0.5}],
                nBins: 1,
                value: {'field': 'value'},
                min: -1,
                max: 1
            });

            expect(bins.length).toBe(1);
            expect(bins[0].min).toBeCloseTo(-1, 8);
            expect(bins[0].max).toBeCloseTo(1, 8);
        });
        it('min given', function () {
            var bins = tangelo.data.bin({
                data: [{'value': 0}, {'value': 0.5}],
                nBins: 1,
                value: {'field': 'value'},
                min: -1,
            });

            expect(bins.length).toBe(1);
            expect(bins[0].min).toBeCloseTo(-1, 8);
            expect(bins[0].max).toBeCloseTo(0.5, 8);
        });
        it('max given', function () {
            var bins = tangelo.data.bin({
                data: [{'value': 0}, {'value': 0.5}],
                nBins: 1,
                value: {'field': 'value'},
                max: 1,
            });

            expect(bins.length).toBe(1);
            expect(bins[0].min).toBeCloseTo(0, 8);
            expect(bins[0].max).toBeCloseTo(1, 8);
        });
        it('bins given', function () {
            var _bins = [{min: -10, max: 10, count: 2}],
                bins = tangelo.data.bin({
                    data: [{'value': 0}, {'value': 0.5}],
                    value: {'field': 'value'},
                    bins: _bins
            });

            expect(bins).toBe(_bins);
        });
    });
    describe('data binning', function () {
        it('with bin creation', function () {
            var data, bins;

            data = [0, 1, 2, 3].map(function (d) {return {value: d};});
            bins = tangelo.data.bin({
                data: data,
                nBins: 3
            });

            expect(bins).toEqual([
                {
                    min: 0,
                    max: 1,
                    count: 1
                },
                {
                    min: 1,
                    max: 2,
                    count: 1
                },
                {
                    min: 2,
                    max: 3,
                    count: 2
                }
            ]);
        });
        it('with min/max given', function () {
            var data, bins;

            data = [1, 3, 5, 7].map(function (d) {return {value: d};});
            bins = tangelo.data.bin({
                data: data,
                nBins: 4,
                min: 0,
                max: 8
            });

            expect(bins).toEqual([
                {
                    min: 0,
                    max: 2,
                    count: 1
                },
                {
                    min: 2,
                    max: 4,
                    count: 1
                },
                {
                    min: 4,
                    max: 6,
                    count: 1
                },
                {
                    min: 6,
                    max: 8,
                    count: 1
                }
            ]);
        });
        it('with bins given', function () {
            var data, bins, _bins;

            _bins = [
                {
                    min: 0,
                    max: 2
                },
                {
                    min: 5,
                    max: 10
                },
                {
                    min: -10,
                    max: -5
                }
            ];
            data = [-7, 1, 3, 5, 7].map(function (d) {return {value: d};});
            bins = tangelo.data.bin({
                data: data,
                bins: _bins
            });

            expect(bins).toEqual([
                {
                    min: 0,
                    max: 2,
                    count: 1
                },
                {
                    min: 5,
                    max: 10,
                    count: 2
                },
                {
                    min: -10,
                    max: -5,
                    count: 1
                }
            ]);

            data = [-5, 1, 2, -6, 10].map(function (d) {return {value: d};});
            bins = tangelo.data.bin({
                data: data,
                bins: bins
            });

            expect(bins).toEqual([
                {
                    min: 0,
                    max: 2,
                    count: 2
                },
                {
                    min: 5,
                    max: 10,
                    count: 3
                },
                {
                    min: -10,
                    max: -5,
                    count: 2
                }
            ]);
        });
    });
});
