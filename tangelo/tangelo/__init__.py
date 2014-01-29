import cherrypy
import copy
import os.path
import sys
import types

def content_type(t=None):
    r = cherrypy.response.headers['Content-type']

    if t is not None:
        cherrypy.response.headers['Content-type'] = t

    return r

def log(*pargs, **kwargs):
    cherrypy.log(*pargs, **kwargs)

def request_path():
    return cherrypy.request.path_info

def request_body():
    class RequestBody:
        get_request_error = RuntimeError("cannot read body from a GET request")

        def __init__(self, filelike, process_request_body):
            self.source = filelike
            self.process_request_body = process_request_body

        def read(self, *pargs, **kwargs):
            if not self.process_request_body:
                raise RequestBody.get_request_error
            else:
                return self.source.read(*pargs, **kwargs)

        def readline(self, *pargs, **kwargs):
            if not self.process_request_body:
                raise RequestBody.get_request_error
            else:
                return self.source.readline(*pargs, **kwargs)

        def readlines(self, *pargs, **kwargs):
            if not self.process_request_body:
                raise RequestBody.get_request_error
            else:
                return self.readlines(*pargs, **kwargs)

    return RequestBody(cherrypy.request.body, cherrypy.request.process_request_body)

def legal_path(path):
    #orig = path
    if os.path.isabs(path):
        return (False, "absolute")

    # Extract the web root directory from the global config.
    webroot = cherrypy.config.get("webroot")

    if path[0] != "~":
        path = os.path.abspath(webroot + os.path.sep + path)
        if len(path) >= len(webroot) and path[:len(webroot)] == webroot:
            return (True, "web root")
    else:
        home = os.path.expanduser("~").split(os.path.sep)[:-1]
        path = os.path.abspath(os.path.expanduser(path))
        comp = path.split(os.path.sep)
        if len(comp) >= len(home) + 2 and comp[:len(home)] == home and comp[len(home)+1] == "tangelo_html":
            return (True, "home directory")

    return (False, "illegal")

def abspath(path):
    if path[0] == "~":
        comp = path.split(os.path.sep)
        comp = [os.path.expanduser(comp[0])] + ["tangelo_html"] + comp[1:]
        path = os.path.sep.join(comp)
    else:
        path = cherrypy.config.get("webroot") + os.path.sep + path

    return os.path.abspath(path)

def paths(runtimepaths):
    # If a single string is passed in, wrap it into a singleton list (this is
    # important because a string in Python is technically a list of lists, so
    # without this check, this function will treat a single string as a list of
    # single-letter strings - not at all what we expect to happen).
    if type(runtimepaths) in types.StringTypes:
        runtimepaths = [runtimepaths]

    home = os.path.expanduser("~").split(os.path.sep)[:-1]
    root = cherrypy.config.get("webroot")

    # This function returns an absolute path if the path is allowed (i.e., in
    # someone's tangelo_html directory, or under the web root directory), or
    # logs a complaint and returns None otherwise.
    def good(path):
        orig = path
        if os.path.isabs(path):
            log("Illegal path (absolute): %s" % (orig), "SERVICE")
            return None

        path = os.path.abspath(cherrypy.thread_data.modulepath + os.path.sep + path)
        if len(path) >= len(root) and path[:len(root)] == root:
            return path

        comp = path.split(os.path.sep)
        if len(comp) >= len(home) + 2 and comp[:len(home)] == home and comp[len(home)+1] == "tangelo_html":
            return path

        log("Illegal path (outside of web space): %s" % (orig), "SERVICE")
        return None

    # Construct the list of new runtime paths by first mapping the checker over
    # the list, then throwing away any Nones that showed up (the paths that led
    # to Nones will have been logged).
    newpaths = filter(lambda x: x is not None, map(good, runtimepaths))

    # Finally, augment the path list.
    sys.path = newpaths + sys.path

def config():
    return copy.deepcopy(cherrypy.config["module-config"][cherrypy.thread_data.modulename])

class HTTPStatusCode:
    def __init__(self, code, msg=None):
        self.code = code
        self.msg = msg

# A decorator that exposes functions as being part of a service's RESTful API.
def restful(f):
    f.restful = True
    return f
