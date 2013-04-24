import cherrypy

# This function defines the structure of a service response.  Each service
# module should import this function from this package.
#
# The payload is contained in the 'result' field, while the 'error' field can
# indicate that something went wrong.  Posibly more fields could be added in the
# future.
def empty_response():
    return {'result' : None,
            'error' : None}

def content_type(t=None):
    r = cherrypy.response.headers['Content-type']

    if t is not None:
        cherrypy.response.headers['Content-type'] = t

    return r

def log(*pargs, **kwargs):
    cherrypy.log(*pargs, **kwargs)

class HTTPStatusCode:
    def __init__(self, code, msg=None):
        self.code = code
        self.msg = msg

# A decorator that exposes functions as being part of a service's RESTful API.
def restful(f):
    f.restful = True
    return f
