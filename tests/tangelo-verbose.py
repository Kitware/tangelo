import fixture


def test_standard_verbosity():
    (_, _, stderr) = fixture.run_tangelo("--port", "30047", timeout=3, terminate=True)
    stderr = '\n'.join(stderr)

    assert 'Server is running' in stderr
    assert 'Hostname' in stderr


def test_lower_verbosity():
    stderr = fixture.start_tangelo("-q", stderr=True)
    stderr = '\n'.join(stderr)

    fixture.stop_tangelo()
    assert 'TANGELO Server is running' in stderr
    assert 'TANGELO Hostname' not in stderr
