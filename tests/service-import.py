import nose
import requests

import fixture


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_service_import_local():
    response = requests.get(fixture.url("import", "oct", "30", color="green", answer="42"))
    expected = "\n".join(["[oct, 30]", "color -> green", "answer -> 42"])

    assert response.content == expected


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_service_import_path():
    response = requests.get(fixture.url("sub/importpath", "oct", "30", color="green", answer="42"))
    expected = "\n".join(["[oct, 30]", "color -> green", "answer -> 42"])

    assert response.content == expected
