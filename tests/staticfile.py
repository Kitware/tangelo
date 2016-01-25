import nose
import requests

import fixture


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_static_file():
    r = requests.get(fixture.url("static_file"))
    print r.text
    assert r.ok
    assert r.status_code == 200
    assert r.text == "Infinite Diversity in Infinite Combinations\n"
    assert "text/plain" in r.headers["Content-Type"]
    r = requests.get(fixture.url(
        "static_file?mime_type=application/octet-stream"))
    assert r.ok
    assert r.status_code == 200
    assert r.text == "Infinite Diversity in Infinite Combinations\n"
    assert "application/octet-stream" in r.headers["Content-Type"]
