QUnit.module("tangelo.absoluteUrl()");

QUnit.test("tangelo.absoluteUrl()", function (assert) {
    "use strict";

    var abspath1,
        abspath2,
        relpath1,
        relpath2;

    abspath1 = "/one/two/three";
    abspath2 = "~pulaski/medical/biobed";
    assert.strictEqual(tangelo.absoluteUrl(abspath1), abspath1, "tangelo.absolutePath() returns absolute paths unchanged");
    assert.strictEqual(tangelo.absoluteUrl(abspath2), abspath2, "tangelo.absolutePath() returns absolute paths unchanged");

    relpath1 = "relative/path/warp.html";
    relpath2 = "relative/path/warp.html?factor=9.2&intermix=1:1#power";
    assert.strictEqual(tangelo.absoluteUrl(relpath1), "/results/js/" + relpath1, "returns relative paths appended to the current directory");
    assert.strictEqual(tangelo.absoluteUrl(relpath2), "/results/js/" + relpath2, "should also work for paths with query arguments and fragment identifiers");
});
