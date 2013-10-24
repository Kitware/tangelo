# This module, which contains a Handler class whose go() method raises an
# exception, is meant for testing the error handling of Tangelo's web service
# module loader system.

def run():
    raise RuntimeError("this is an example error, from web service 'exceptional'")
