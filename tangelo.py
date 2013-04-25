import cherrypy
import os.path
import sys

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

def request_path():
    return cherrypy.request.path_info

# TODO(choudhury): this leaves a global variable open for anyone to modify;
# there's a crazy hack (sanctioned by Guido himself) that lets us get around it:
# http://stackoverflow.com/questions/2447353/getattr-on-a-module (Ethan Furman's
# answer), which references this email:
# http://mail.python.org/pipermail/python-ideas/2012-May/014969.html
_modulepath = None
def modulepath(mp):
    global _modulepath
    _modulepath = mp
    log("modulepath: %s" % (_modulepath))

def paths(runtimepaths):
    log("paths: %s" % (_modulepath))
    sys.path = map(lambda x: os.path.abspath(_modulepath + "/" + x), runtimepaths) + sys.path

class HTTPStatusCode:
    def __init__(self, code, msg=None):
        self.code = code
        self.msg = msg

# A decorator that exposes functions as being part of a service's RESTful API.
def restful(f):
    f.restful = True
    return f
