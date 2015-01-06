import fixture


def test_bad_config():
    (code, stdout, stderr) = fixture.run_tangelo("-c", "tests/config/bad-config.yaml")

    print "Expected: 'ERROR while parsing' in log"
    print "Received: %s" % (stdout[1] if len(stdout) > 1 else "(nothing)")

    assert len(stdout) > 1
    assert "ERROR while parsing" in stdout[1]
