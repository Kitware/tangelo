import fixture
import json
import nose
import requests


def start_tangelo():
    """Start tangelo with a some settings."""
    config = {"settings": [{"server": {"server.thread_pool": 1000}}]}
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
    config = {"settings": "Angosian"}
    (_, _, stderr) = fixture.run_tangelo(
        "-c", json.dumps(config), terminate=True)
    stderr = "\n".join(stderr)

    print stderr

    assert "option settings must be of type list or dict" in stderr


def test_config_bad_settings():
    config = {"settings": ["Angosian"]}
    (_, _, stderr) = fixture.run_tangelo(
        "-c", json.dumps(config), terminate=True)
    stderr = "\n".join(stderr)

    print stderr

    assert "Can't process setting Angosian" in stderr


def test_config_unknown_settings():
    config = {"settings": [{"unknown": {"Angosian": "Tarsian"}}]}
    (_, _, stderr) = fixture.run_tangelo(
        "-c", json.dumps(config), terminate=True)
    stderr = "\n".join(stderr)

    print stderr

    assert "Setting unknown.Angosian was ignored." in stderr
