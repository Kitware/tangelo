import nose
import requests
import string

import fixture


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_prime_service():
    primes = [int(requests.get(fixture.url("primes", n=nn)).content) for nn in range(5)]

    assert primes == [2, 3, 5, 7, 11]

@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_prime_stream():
    stream_key = requests.post(fixture.plugin_url("stream", "stream", "start", "primes")).json()

    assert "key" in stream_key and all([letter in string.hexdigits for letter in stream_key["key"]])

    key = stream_key["key"]
    primes = []

    for i in range(5):
        response = requests.post(fixture.plugin_url("stream", "stream", "next", key))
        assert response.status_code == 200

        primes.append(response.json())

    assert primes == [2, 3, 5, 7, 11]

@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_finite_stream():
    stream_key = requests.post(fixture.plugin_url("stream", "stream", "start", "finite")).json()

    assert "key" in stream_key

    key = stream_key["key"]

    hello = requests.post(fixture.plugin_url("stream", "stream", "next", key))
    world = requests.post(fixture.plugin_url("stream", "stream", "next", key))
    finished = requests.post(fixture.plugin_url("stream", "stream", "next", key))
    not_found = requests.post(fixture.plugin_url("stream", "stream", "next", key))

    # The 200 in these responses means that there was data in the stream.
    assert hello.status_code == 200
    assert hello.content == "hello"

    assert world.status_code == 200
    assert world.content == "world"

    # The 204 in this response means the stream is out of data.
    assert finished.status_code == 204

    # Now that the stream has finished, querying it again should result in a
    # 404.
    assert not_found.status_code == 404

@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_multiple_streams():
    key1 = requests.post(fixture.plugin_url("stream", "stream", "start", "finite")).json()["key"]
    key2 = requests.post(fixture.plugin_url("stream", "stream", "start", "finite")).json()["key"]
    key3 = requests.post(fixture.plugin_url("stream", "stream", "start", "finite")).json()["key"]

    server_keys = requests.get(fixture.plugin_url("stream", "stream")).json()
    server_keys.sort()

    my_keys = [key1, key2, key3]
    my_keys.sort()

    print server_keys
    print my_keys

    assert server_keys == my_keys

@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_delete_stream():
    key1 = requests.post(fixture.plugin_url("stream", "stream", "start", "finite")).json()["key"]
    key2 = requests.post(fixture.plugin_url("stream", "stream", "start", "finite")).json()["key"]
    key3 = requests.post(fixture.plugin_url("stream", "stream", "start", "finite")).json()["key"]

    key2d = requests.delete(fixture.plugin_url("stream", "stream", key2)).json()

    assert "key" in key2d
    assert key2d["key"] == key2

    server_keys = requests.get(fixture.plugin_url("stream", "stream")).json()
    server_keys.sort()

    my_keys = [key1, key3]
    my_keys.sort()

    print server_keys
    print my_keys

    assert server_keys == my_keys
