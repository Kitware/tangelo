import nose
import requests

import fixture


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_version():
    response = requests.get(fixture.plugin_url("tangelo", "version"))
    expected = "0.9.0"

    assert response.content == expected
