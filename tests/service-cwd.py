import nose
import requests

import fixture


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_service_cwd():
    response = requests.get(fixture.url("/cwd"))
    expected = fixture.relative_path("tests/web")

    assert response.content == expected
