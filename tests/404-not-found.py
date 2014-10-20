import nose
import requests

import fixture


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_404_not_found():
    response = requests.get(fixture.url("/does-not-exist.html"))
    assert response.status_code == 404
