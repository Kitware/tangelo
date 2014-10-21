import nose
import requests

import fixture


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_200_ok():
    response = requests.get(fixture.url("/"))
    assert response.status_code == 200
