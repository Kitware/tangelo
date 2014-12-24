import os
import nose
import requests

import fixture
from tangelo.server import Content
from tangelo.server import Directive

cwd = os.getcwd()


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_closed_source():
    analysis = requests.get(fixture.url("analyze-url/analyze-url", test=1)).json()

    print analysis

    assert analysis["directive"] is None
    assert analysis["content"] is not None
    assert analysis["content"]["type"] == Content.File
    assert analysis["content"]["path"] is None
    assert analysis["content"]["pargs"] is None


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_open_source():
    analysis = requests.get(fixture.url("analyze-url/analyze-url", test=2)).json()

    assert analysis["directive"] is None
    assert analysis["content"] is not None
    assert analysis["content"]["type"] == Content.File
    assert analysis["content"]["path"] == fixture.relative_path("tests/web/analyze-url/open.py")
    assert analysis["content"]["pargs"] is None


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_closed_config():
    analysis = requests.get(fixture.url("analyze-url/analyze-url", test=3)).json()

    assert analysis["directive"] is None
    assert analysis["content"] is not None
    assert analysis["content"]["type"] == Content.File
    assert analysis["content"]["path"] is None
    assert analysis["content"]["pargs"] is None


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_open_nonconfig():
    analysis = requests.get(fixture.url("analyze-url/analyze-url", test=4)).json()

    assert analysis["directive"] is None
    assert analysis["content"] is not None
    assert analysis["content"]["type"] == Content.File
    assert analysis["content"]["path"] == fixture.relative_path("tests/web/analyze-url/standalone.yaml")
    assert analysis["content"]["pargs"] is None


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_directory():
    analysis = requests.get(fixture.url("analyze-url/analyze-url", test=6)).json()

    assert analysis["directive"] is None
    assert analysis["content"] is not None
    assert analysis["content"]["type"] == Content.Directory
    assert analysis["content"]["path"] == fixture.relative_path("tests/web/analyze-url/")
    assert analysis["content"]["pargs"] is None


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_redirect_directory():
    analysis = requests.get(fixture.url("analyze-url/analyze-url", test=7)).json()

    assert analysis["directive"] is not None
    assert analysis["directive"]["type"] == Directive.HTTPRedirect
    assert analysis["directive"]["argument"] == "/analyze-url/"
    assert analysis["content"] is None


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_redirect_index():
    analysis = requests.get(fixture.url("analyze-url/analyze-url", test=8)).json()

    assert analysis["directive"] is not None
    assert analysis["directive"]["type"] == Directive.InternalRedirect
    assert analysis["directive"]["argument"] == "/analyze-url/has-index/index.html"
    assert analysis["content"] is None


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_list_plugins():
    analysis = requests.get(fixture.url("analyze-url/analyze-url", test=9)).json()

    assert analysis["directive"] is not None
    assert analysis["directive"]["type"] == Directive.ListPlugins
    assert analysis["directive"]["argument"] is None
    assert analysis["content"] is None


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_service():
    analysis = requests.get(fixture.url("analyze-url/analyze-url", test=10)).json()

    assert analysis["directive"] is None
    assert analysis["content"] is not None
    assert analysis["content"]["type"] == Content.Service
    assert analysis["content"]["path"] == fixture.relative_path("tests/web/analyze-url/analyze-url.py")
    assert analysis["content"]["pargs"] == ["1", "2", "3"]


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_not_found():
    analysis = requests.get(fixture.url("analyze-url/analyze-url", test=11)).json()

    assert analysis["directive"] is None
    assert analysis["content"] is not None
    assert analysis["content"]["type"] == Content.NotFound
    assert analysis["content"]["path"] == "/analyze-url/doesnt-exist.html"
    assert analysis["content"]["pargs"] is None
