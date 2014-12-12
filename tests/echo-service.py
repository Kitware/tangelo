import nose
import requests

import fixture


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_echo_service():
    response = requests.get(fixture.url("echo", "oct", "30", color="green", answer="42"))
    expected = "\n".join(["[oct, 30]", "color -> green", "answer -> 42"])

    assert response.content == expected
