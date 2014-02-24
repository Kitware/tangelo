import unittest
import tangelo.util


class Tester(unittest.TestCase):
    def test_get_free_port(self):
        result = True

        for i in xrange(100):
            port = tangelo.util.get_free_port()
            # TODO: detect whether port is really free?
            print "Got free port: %d" % (port)

            result = result and (port > 1024)

        self.assertTrue(result)

if __name__ == "__main__":
    unittest.main()
