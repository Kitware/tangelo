import fixture


def test_bad_config():
    (code, stdout, stderr) = fixture.run_tangelo("-c", "tests/config/bad-config.yaml")

    signal = "ERROR while parsing"

    print "Expected: '%s' in second line of log" % (signal)
    print "Received: %s" % (stdout[1] if len(stdout) > 1 else "")

    assert len(stdout) > 1
    assert signal in stdout[1]


def test_non_dict_config():
    (code, stdout, stderr) = fixture.run_tangelo("-c", "tests/config/list-config.yaml")

    signal = "does not contain associative array"

    print "Expected: '%s' in second line of log" % (signal)
    print "Received: %s" % (stdout[1] if len(stdout) > 1 else "")

    assert len(stdout) > 1
    assert signal in stdout[1]
