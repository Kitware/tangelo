import fixture


def test_standard_verbosity():
    stderr = fixture.start_tangelo(stderr=True)
    stderr = '\n'.join(stderr)

    fixture.stop_tangelo()
    assert 'TANGELO Server is running' in stderr
    assert 'TANGELO Hostname' in stderr


def test_lower_verbosity():
    stderr = fixture.start_tangelo("-q", stderr=True)
    stderr = '\n'.join(stderr)

    fixture.stop_tangelo()
    assert 'TANGELO Server is running' in stderr
    assert 'TANGELO Hostname' not in stderr
