import fixture


def test_commandline_version():
    (code, stdout, stderr) = fixture.run_tangelo("--version")
    expected = "0.9.0-dev"

    print "Expected: %s" % (expected)
    print "Received: %s" % ("\n".join(stdout))

    assert code == 0
    assert stderr == []
    assert len(stdout) == 1 and stdout[0] == expected
