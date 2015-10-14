import fixture
import nose
import requests
import os
import pprint
import time


def get_times(response):
    """
    Parse a response from a watch script to get the reported times.

    :param response: the response from a requests.get call.
    :returns: a dictionary of parsed times.
    """
    times = {}
    for part in response.content.split("Watch ")[1:]:
        name = part.split(" [")[0]
        timestamp = part.split(" [")[1].split("]")[0]
        times[name] = timestamp
    pprint.pprint(times)
    return times


def start_tangelo():
    """Start tangelo with the watch plugin."""
    return fixture.start_tangelo("--watch")


def touch_file(path):
    """
    Use os.utime to touch a file, but add a delay to make sure things have a
    chance to change.

    :param path: path to touch.
    """
    time.sleep(2)
    os.utime(path, None)


@nose.with_setup(start_tangelo, fixture.stop_tangelo)
def test_watch_plugin():
    times = []
    # Check the original time
    response = requests.get(fixture.url("watch_a"))
    assert "Watch A" in response.content
    times.append(get_times(response))

    # Calling this again shouldn't change any import time.
    response = requests.get(fixture.url("watch_a"))
    times.append(get_times(response))
    assert times[-2] == times[-1]

    # Touch script A and check that we now get a new time for A, but not for
    # the sub scripts.
    touch_file("tests/web/watch_a.py")
    response = requests.get(fixture.url("watch_a"))
    times.append(get_times(response))
    assert times[-2]["A"] != times[-1]["A"]
    assert times[-2]["B"] == times[-1]["B"]
    assert times[-2]["C"] == times[-1]["C"]
    assert times[-2]["D"] == times[-1]["D"]

    # Touch script B and check that script A updates with that, too.
    touch_file("tests/web/watch_b.py")
    response = requests.get(fixture.url("watch_a"))
    times.append(get_times(response))
    assert times[-2]["A"] != times[-1]["A"]
    assert times[-2]["B"] != times[-1]["B"]
    assert times[-2]["C"] == times[-1]["C"]
    assert times[-2]["D"] == times[-1]["D"]

    # And again with script D which is several layers in
    touch_file("tests/web/watch_d.py")
    response = requests.get(fixture.url("watch_a"))
    times.append(get_times(response))
    assert times[-2]["A"] != times[-1]["A"]
    assert times[-2]["B"] != times[-1]["B"]
    assert times[-2]["C"] != times[-1]["C"]
    assert times[-2]["D"] != times[-1]["D"]

    # Touching script C and then loading E should show a new C time
    touch_file("tests/web/watch_c.py")
    response = requests.get(fixture.url("watch_e"))
    times.append(get_times(response))
    assert times[-2]["C"] != times[-1]["C"]
    assert times[-2]["D"] == times[-1]["D"]

    # Touch script B.  Calling E should not show any difference in times.
    touch_file("tests/web/watch_b.py")
    response = requests.get(fixture.url("watch_e"))
    times.append(get_times(response))
    assert times[-2] == times[-1]

    # All done
