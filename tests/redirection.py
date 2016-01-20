import nose
import requests

import fixture


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_redirect():
    r = requests.get(fixture.url("redirect/redirect"))
    assert r.ok
    assert r.status_code == 200
    assert r.text == "hello, world\n"

    r = requests.get(fixture.url("redirect/internal_redirect"))
    assert r.ok
    assert r.status_code == 200
    assert r.text == "hello, world\n"
