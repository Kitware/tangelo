import nose
import requests

import fixture


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_server_identity():
    response = requests.get(fixture.url("/"))
    assert response.headers["server"] == ""
