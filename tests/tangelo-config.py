import fixture
import json


def test_bad_config():
    (code, stdout, stderr) = fixture.run_tangelo("-c", "tests/config/bad-config.yaml")

    signal = "ERROR while parsing"

    print "Expected: '%s' in third line of log" % (signal)
    print "Received: %s" % (stderr[1] if len(stderr) > 1 else "")

    assert len(stderr) > 1
    assert signal in stderr[2]


def test_non_dict_config():
    (code, stdout, stderr) = fixture.run_tangelo("-c", "tests/config/list-config.yaml")

    signal = "does not contain associative array"

    print "Expected: '%s' in third line of log" % (signal)
    print "Received: %s" % (stderr[2] if len(stderr) > 1 else "")

    assert len(stderr) > 1
    assert signal in stderr[2]


def test_inline_config():
    config = {"plugins": [{"name": "ui"}]}
    (_, _, stderr) = fixture.run_tangelo("-c", json.dumps(config), terminate=True)
    stderr = "\n".join(stderr)

    print stderr

    assert "Server is running" in stderr
    assert "Plugin ui loaded" in stderr
