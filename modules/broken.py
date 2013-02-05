# This module, which contains a Handler class with no go() method, is meant for
# testing the error handling capabilities of the xdataweb's web service module
# loader system.

class Handler:
    def start():
        raise RuntimeError("this method is for testing only")
