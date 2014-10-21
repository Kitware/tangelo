import json
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
    stream_key = json.loads(requests.post(fixture.url("api", "stream", "start", "primes")).content)

    assert "key" in stream_key and all([letter in string.hexdigits for letter in stream_key["key"]])

    key = stream_key["key"]
    primes = []

    for i in range(5):
        response = requests.post(fixture.url("api", "stream", "next", key))
        assert response.status_code == 200

        primes.append(json.loads(response.content))

    assert primes == [2, 3, 5, 7, 11]

@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_finite_stream():
    stream_key = json.loads(requests.post(fixture.url("api", "stream", "start", "finite")).content)

    assert "key" in stream_key

    key = stream_key["key"]

    hello = requests.post(fixture.url("api", "stream", "next", key))
    world = requests.post(fixture.url("api", "stream", "next", key))
    finished = requests.post(fixture.url("api", "stream", "next", key))
    not_found = requests.post(fixture.url("api", "stream", "next", key))

    # The 200 in these responses means that there was data in the stream.
    assert hello.status_code == 200
    assert json.loads(hello.content) == "hello"

    assert world.status_code == 200
    assert json.loads(world.content) == "world"

    # The 204 in this response means the stream is out of data.
    assert finished.status_code == 204

    # Now that the stream has finished, querying it again should result in a
    # 404.
    assert not_found.status_code == 404
