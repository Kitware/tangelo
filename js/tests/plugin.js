QUnit.module("Tangelo plugins");

QUnit.test("tangelo.ensurePlugin()", function (assert) {
    "use strict";

    var slogan;

    tangelo.ensurePlugin("slugocola");
    assert.deepEqual(tangelo.plugin.slugocola, {}, "A freshly created plugin should be installed to the tangelo plugin namespace and be empty");

    slogan = "Drink Slug-o-Cola! The slimiest cola in the galaxy!";
    tangelo.plugin.slugocola.slogan = slogan;
    assert.strictEqual(tangelo.plugin.slugocola.slogan, slogan, "Using the plugin object shoould affect the actual plugin namespace");

    tangelo.plugin.slugocola.add = function (a, b) {
        return a + b;
    };
    assert.strictEqual(tangelo.plugin.slugocola.add(3, 4), 7, "Functions installed in the plugin should work as expected");

    tangelo.ensurePlugin("slugocola");
    assert.strictEqual(tangelo.plugin.slugocola.slogan, slogan, "tangelo.ensurePlugin() is idempotent - 1");
    assert.strictEqual(tangelo.plugin.slugocola.add(3, 4), 7, "tangelo.ensurePlugin() is idempotent - 2");
});

QUnit.test("tangelo.pluginUrl()", function (assert) {
    "use strict";

    assert.throws(tangelo.pluginUrl, "Passing no arguments causes an error");
    assert.deepEqual(tangelo.pluginUrl("slugocola"), "/plugin/slugocola", "Passing a single argument returns the root for a particular plugin");
    assert.deepEqual(tangelo.pluginUrl("slugocola", "formula", "slime"), "/plugin/slugocola/formula/slime", "Passing multiple arguments constructs a longer url");
});
