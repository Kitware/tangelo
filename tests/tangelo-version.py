import nose
import requests

import fixture


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_version():
    response = requests.get(fixture.plugin_url("tangelo", "version"))
    expected = "0.10.0-dev"

    assert response.content == expected
