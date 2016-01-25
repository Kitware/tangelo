import fixture
import json
import nose
import requests


def start_tangelo():
    """Start tangelo with a some settings."""
    config = {"server_settings": {"server.thread_pool": 1000}}
    return fixture.start_tangelo("-c", json.dumps(config))


@nose.with_setup(start_tangelo, fixture.stop_tangelo)
def test_config_settings():
    response = requests.get(fixture.url('settings'))
    print response
    assert 'pool="1000"' in response


@nose.with_setup(start_tangelo, fixture.stop_tangelo)
def test_config_settings_change():
    response = requests.get(fixture.url('settings', pool='500'))
    print response
    assert 'pool="500"' in response


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_config_no_settings():
    response = requests.get(fixture.url('settings'))
    print response
    assert 'pool="None"' in response


def test_config_wrong_type_settings():
    config = {"server_settings": "Angosian"}
    (_, _, stderr) = fixture.run_tangelo(
        "-c", json.dumps(config), terminate=True)
    stderr = "\n".join(stderr)

    print stderr

    assert "option server_settings must be of type dict" in stderr
