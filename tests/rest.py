import json
import nose
import requests
import string

import fixture


@nose.with_setup(fixture.start_tangelo, fixture.stop_tangelo)
def test_restful_service():
    pos = ["one", "two", "three"]
    query = {"foo": "bar", "that": "telling"}

    url = fixture.url("restful", *pos, **query)
    expected = "%s: one two three {'foo': u'bar', 'that': u'telling'}"

    get = requests.get(url).text
    post = requests.post(url).text
    put = requests.put(url).text
    delete = requests.delete(url)
    propfind = requests.request("PROPFIND", url).text
    dukat = requests.request("DUKAT", url).text
    undefined = requests.request("UNDEFINED", url)

    # GET, POST, and PUT are standard rest verbs.
    assert get == expected % ("GET")
    assert post == expected % ("POST")
    assert put == expected % ("PUT")

    # PROPFIND is a less common rest verb.
    assert propfind == expected % ("PROPFIND")

    # DUKAT is not a standard rest verb, but the service will still respond to
    # it because it is defined properly.
    assert dukat == expected % ("DUKAT")

    # Though DELETE *is* a standard rest verb, the service module does not
    # expose it properly, resulting in a 405 Method Not Allowed error.
    assert delete.status_code == 405

    # UNDEFINED is not a standard rest verb, and it is not defined in the
    # service module - it should also give a 405 error.
    print undefined
    assert undefined.status_code == 405
