QUnit.module("config plugin");

QUnit.test("Non-required non-existing config file", function (assert) {
    "use strict";

    QUnit.stop();

    tangelo.plugin.config.config("/data/doesntexist.json", false, function (config) {
        QUnit.start();

        assert.deepEqual(config, {}, "Non required config file should return empty object when file doesn't exist");
    });
});

QUnit.test("Required non-existing config file", function (assert) {
    "use strict";

    QUnit.stop();

    tangelo.plugin.config.config("/data/doesntexist.json", true, function (config, error) {
        QUnit.start();

        assert.strictEqual(config, undefined, "Required config file should return undefined when file doesn't exist");
        assert.ok(error.error, "'error' parameter contains an error message");
        assert.strictEqual(error.file, "/data/doesntexist.json", "'error' parameter named the missing file");
    });
});

QUnit.test("Non-required existing config file", function (assert) {
    "use strict";

    QUnit.stop();

    tangelo.plugin.config.config("/data/config.json", false, function (config) {
        QUnit.start();

        assert.deepEqual(config, {captain: "picard", firstOfficer: "riker", counselor: "troi"}, "Non required config file should return correct config when file does exist");
    });
});

QUnit.test("Required existing config file", function (assert) {
    "use strict";

    QUnit.stop();

    tangelo.plugin.config.config("/data/config.json", true, function (config) {
        QUnit.start();

        assert.deepEqual(config, {captain: "picard", firstOfficer: "riker", counselor: "troi"}, "Required config file should return correct config when file does exist");
    });
});

QUnit.test("default 'required' parameter value", function (assert) {
    "use strict";

    QUnit.stop(2);

    tangelo.plugin.config.config("/data/doesntexist.json", function (config) {
        QUnit.start();

        assert.deepEqual(config, {}, "'required' defaults to false (non-existing config file)");
    });

    tangelo.plugin.config.config("/data/config.json", function (config) {
        QUnit.start();

        assert.deepEqual(config, {captain: "picard", firstOfficer: "riker", counselor: "troi"}, "'required' defaults to false (existing config file)");
    });
});

QUnit.test("'url' parameter is required", function (assert) {
    "use strict";

    assert.throws(tangelo.plugin.config.config);
});
