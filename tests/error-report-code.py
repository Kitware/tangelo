import requests

import fixture


def bad_service():
    return requests.get(fixture.url("bad"))


def test_error_code():
    (_, _, stderr, result) = fixture.run_tangelo("--host", fixture.host, "--port", fixture.port, "--root", "tests/web",
                                                 timeout=5, terminate=True, action=bad_service)

    logcode = filter(lambda x: "SERVICE" in x, stderr)[0][-10:-4]
    reportcode = result.json()["message"].split()[2]

    assert logcode == reportcode
