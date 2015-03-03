import tangelo.util


def test_get_free_port():
    for _ in xrange(1000):
        free_port = tangelo.util.get_free_port()
        print "Got free port: %d" % (free_port)

        assert free_port > 1024
