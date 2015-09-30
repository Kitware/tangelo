import fixture


def test_standard_verbosity():
    stderr = fixture.start_tangelo(stderr=True)
    stderr = '\n'.join(stderr)

    print stderr

    assert 'TANGELO Server is running' in stderr
    assert 'TANGELO Hostname' in stderr
    fixture.stop_tangelo()


def test_lower_verbosity():
    stderr = fixture.start_tangelo("-q", stderr=True)
    stderr = '\n'.join(stderr)

    print stderr

    assert 'TANGELO Server is running' in stderr
    assert 'TANGELO Hostname' not in stderr
    fixture.stop_tangelo()
