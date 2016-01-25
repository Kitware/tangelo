import fixture


def test_standard_verbosity():
    (_, _, stderr) = fixture.run_tangelo("--port", "30047", timeout=3, terminate=True)
    stderr = "\n".join(stderr)

    assert "Server is running" in stderr
    assert "Hostname" in stderr


def test_lower_verbosity():
    (_, _, stderr) = fixture.run_tangelo("-q", "--port", "30047", timeout=3, terminate=True)

    assert len(stderr) == 0
