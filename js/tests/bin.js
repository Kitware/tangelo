QUnit.module("tangelo.data.bin");

QUnit.test("Bin array creation - one bin", function (assert) {
    "use strict";

    var bins = tangelo.data.bin({
        data: [{value: 0}, {value: 1}],
        nBins: 1,
        value: {field: "value"}
    });

    assert.expect(3);

    assert.strictEqual(bins.length, 1);
    assert.ok(bins[0].min < 1e-8);
    assert.ok(bins[0].max - 1 < 1e-8);
});

QUnit.test("Bin array creation - degenerate data", function (assert) {
    "use strict";

    var bins = tangelo.data.bin({
        data: [{value: 0}, {value: 0}],
        nBins: 1,
        value: {field: "value"}
    });

    assert.expect(3);

    assert.strictEqual(bins.length, 1);
    assert.ok(bins[0].min - (-0.5) < 1e-8);
    assert.ok(bins[0].max - 0.5 < 1e-8);
});

QUnit.test("Bin array creation - two bins", function (assert) {
    "use strict";

    var bins = tangelo.data.bin({
        data: [{value: 0}, {value: 1}],
        nBins: 2,
        value: {field: "value"}
    });

    assert.expect(5);

    assert.strictEqual(bins.length, 2);
    assert.ok(bins[0].min < 1e-8);
    assert.ok(bins[0].max - 0.5 < 1e-8);
    assert.ok(bins[1].min - 0.5 < 1e-8);
    assert.ok(bins[1].max - 1 < 1e-8);
});

QUnit.test("Bin array creation - default nBins", function (assert) {
    "use strict";

    var bins = tangelo.data.bin({
        data: [{value: 0}, {value: 0}],
        value: {field: "value"}
    });

    assert.expect(1);

    assert.strictEqual(bins.length, 25);
});

QUnit.test("Bin array creation - no data", function (assert) {
    "use strict";

    var bins = tangelo.data.bin();

    assert.expect(1);

    assert.strictEqual(bins.length, 0);
});

QUnit.test("Bin array creation - min/max given", function (assert) {
    "use strict";

    var bins = tangelo.data.bin({
        data: [{value: 0}, {value: 0.5}],
        nBins: 1,
        value: {field: "value"},
        min: -1,
        max: 1
    });

    assert.expect(3);

    assert.strictEqual(bins.length, 1);
    assert.ok(bins[0].min - (-1) < 1e-8);
    assert.ok(bins[0].max - 1 < 1e-8);
});

QUnit.test("Bin array creation - min given", function (assert) {
    "use strict";

    var bins = tangelo.data.bin({
        data: [{value: 0}, {value: 0.5}],
        nBins: 1,
        value: {field: "value"},
        min: -1
    });

    assert.expect(3);

    assert.strictEqual(bins.length, 1);
    assert.ok(bins[0].min - (-1) < 1e-8);
    assert.ok(bins[0].max - 0.5 < 1e-8);
});

QUnit.test("Bin array creation - max given", function (assert) {
    "use strict";

    var bins = tangelo.data.bin({
        data: [{value: 0}, {value: 0.5}],
        nBins: 1,
        value: {field: "value"},
        max: 1
    });

    assert.expect(3);

    assert.strictEqual(bins.length, 1);
    assert.ok(bins[0].min - 0 < 1e-8);
    assert.ok(bins[0].max - 1 < 1e-8);
});

QUnit.test("Bin array creation - bins given", function (assert) {
    "use strict";

    var _bins = [{min: -10, max: 10, count: 2}],
        bins = tangelo.data.bin({
            data: [{value: 0}, {value: 0.5}],
            value: {field: "value"},
            bins: _bins
        });

    assert.expect(1);

    assert.strictEqual(bins, _bins);
});

QUnit.test("Data binning - with bin creation", function (assert) {
    "use strict";

    var data, bins;

    data = [0, 1, 2, 3].map(function (d) {
        return {value: d};
    });
    bins = tangelo.data.bin({
        data: data,
        nBins: 3
    });

    assert.expect(1);

    assert.deepEqual(bins, [
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

QUnit.test("Data binning - with min/max given", function (assert) {
    "use strict";

    var data, bins;

    data = [1, 3, 5, 7].map(function (d) {
        return {value: d};
    });
    bins = tangelo.data.bin({
        data: data,
        nBins: 4,
        min: 0,
        max: 8
    });

    assert.expect(1);

    assert.deepEqual(bins, [
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

QUnit.test("Data binning - with bins given", function (assert) {
    "use strict";

    var data, bins, _bins;

    assert.expect(2);

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
    data = [-7, 1, 3, 5, 7].map(function (d) {
        return {value: d};
    });
    bins = tangelo.data.bin({
        data: data,
        bins: _bins
    });

    assert.deepEqual(bins, [
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

    data = [-5, 1, 2, -6, 10].map(function (d) {
        return {value: d};
    });
    bins = tangelo.data.bin({
        data: data,
        bins: bins
    });

    assert.deepEqual(bins, [
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
