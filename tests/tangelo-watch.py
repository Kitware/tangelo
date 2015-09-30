import fixture


def test_watch():
    (code, stdout, stderr) = fixture.run_tangelo("--watch")

    print code, stdout, stderr

    # assert False
