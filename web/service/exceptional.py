# This module, which contains a Handler class whose go() method raises an
# exception, is meant for testing the error handling of Tangelo's web service
# module loader system.

class Handler:
    def go(self):
        raise RuntimeError("this is an example error, from web service 'exceptional'")
