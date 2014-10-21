import tangelo.util

def test_get_free_port():
    for _ in xrange(100):
        free_port = tangelo.util.get_free_port()
        print "Got free port: %d" % (free_port)

        yield check_port, free_port

def check_port(port):
    assert port > 1024
