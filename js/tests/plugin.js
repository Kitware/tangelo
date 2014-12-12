QUnit.module("Tangelo plugins");

QUnit.test("tangelo.getPlugin()", function (assert) {
    "use strict";

    var plugin,
        slogan,
        plugin2;

    plugin = tangelo.getPlugin("slugocola");
    assert.deepEqual(tangelo.plugin.slugocola, {}, "A freshly created plugin should be installed to the tangelo plugin namespace and be empty");

    slogan = "Drink Slug-o-Cola! The slimiest cola in the galaxy!";
    plugin.slogan = slogan;
    assert.strictEqual(tangelo.plugin.slugocola.slogan, slogan, "Using the plugin object shoould affect the actual plugin namespace");

    tangelo.plugin.slugocola.add = function (a, b) {
        return a + b;
    };
    assert.strictEqual(tangelo.plugin.slugocola.add(3, 4), 7, "Functions installed in the plugin should work as expected");

    plugin2 = tangelo.getPlugin("slugocola");
    assert.strictEqual(plugin, plugin2, "Using getPlugin() on an existing plugin should return a reference to the plugin");
});

QUnit.test("tangelo.pluginUrl()", function (assert) {
    "use strict";

    assert.throws(tangelo.pluginUrl, "Passing no arguments causes an error");
    assert.deepEqual(tangelo.pluginUrl("slugocola"), "/plugin/slugocola", "Passing a single argument returns the root for a particular plugin");
    assert.deepEqual(tangelo.pluginUrl("slugocola", "formula", "slime"), "/plugin/slugocola/formula/slime", "Passing multiple arguments constructs a longer url");
});
