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
    time.sleep(1)


@nose.with_setup(start_tangelo, fixture.stop_tangelo)
def test_watch_plugin():
    # Check the original time
    response = requests.get(fixture.url("watch_a"))
    assert "Watch A" in response.content
    first_times = get_times(response)

    # Touch script A and check that we now get a new time for A, but not for
    # the sub scripts.
    touch_file("tests/web/watch_a.py")
    response = requests.get(fixture.url("watch_a"))
    second_times = get_times(response)
    assert first_times["A"] != second_times["A"]
    assert first_times["B"] == second_times["B"]
    assert first_times["C"] == second_times["C"]
    assert first_times["D"] == second_times["D"]

    # Touch script B and check that script A updates with that, too.
    touch_file("tests/web/watch_b.py")
    response = requests.get(fixture.url("watch_a"))
    third_times = get_times(response)
    assert second_times["A"] != third_times["A"]
    assert second_times["B"] != third_times["B"]
    assert second_times["C"] == third_times["C"]
    assert second_times["D"] == third_times["D"]

    # And again with script D which is several layers in
    touch_file("tests/web/watch_d.py")
    response = requests.get(fixture.url("watch_a"))
    fourth_times = get_times(response)
    assert first_times["A"] != fourth_times["A"]
    assert first_times["B"] != fourth_times["B"]
    assert first_times["C"] != fourth_times["C"]
    assert first_times["D"] != fourth_times["D"]

    # Touching script C and then loading E should show a new C time
    touch_file("tests/web/watch_c.py")
    response = requests.get(fixture.url("watch_e"))
    fifth_times = get_times(response)
    assert fourth_times["C"] != fifth_times["C"]
    assert fourth_times["D"] == fifth_times["D"]

    # Touch script B.  Calling E should not show any difference in times.
    touch_file("tests/web/watch_b.py")
    response = requests.get(fixture.url("watch_e"))
    sixth_times = get_times(response)
    assert fifth_times["C"] == sixth_times["C"]
    assert fifth_times["D"] == sixth_times["D"]
    assert fifth_times["E"] == sixth_times["E"]

    # All done
