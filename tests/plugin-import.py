import fixture
import json


def test_plugin_module():
    config = {'plugins': [{
        'name': 'moduletest',
        'path': 'tests/plugins/moduletest'
    }]}
    (_, _, stderr) = fixture.run_tangelo('--config', json.dumps(config), timeout=3, terminate=True)
    stderr = '\n'.join(stderr)

    assert 'Plugin has value server.TestConstant True' in stderr


def test_plugin_single_file():
    config = {'plugins': [{
        'name': 'pythonfile',
        'path': 'tests/plugins/pythonfile'
    }]}
    (_, _, stderr) = fixture.run_tangelo('--config', json.dumps(config), timeout=3, terminate=True)
    stderr = '\n'.join(stderr)

    assert 'Python file plugin' in stderr


def test_plugin_order_good():
    config = {'plugins': [{
        'name': 'moduletest',
        'path': 'tests/plugins/moduletest'
    }, {
        'name': 'pluginorder',
        'path': 'tests/plugins/pluginorder'
    }]}
    (_, _, stderr) = fixture.run_tangelo('--config', json.dumps(config), timeout=3, terminate=True)
    stderr = '\n'.join(stderr)

    assert 'Plugin can reference tangelo.plugin.moduletest True' in stderr


def test_plugin_order_bad():
    config = {'plugins': [{
        'name': 'pluginorder',
        'path': 'tests/plugins/pluginorder'
    }, {
        'name': 'moduletest',
        'path': 'tests/plugins/moduletest'
    }]}
    res = fixture.start_tangelo('--config', json.dumps(config), stderr=True)

    if not isinstance(res, tuple):
        fixture.stop_tangelo()
        assert 'Tangelo started when we expected it to fail' is False
    stderr = '\n'.join(res[1])

    assert 'Plugin can reference tangelo.plugin.moduletest True' not in stderr
