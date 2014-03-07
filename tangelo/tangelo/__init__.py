import cherrypy
import copy
import functools
import os.path
import sys
from types import StringTypes


def content_type(t=None):
    r = cherrypy.response.headers['Content-type']

    if t is not None:
        cherrypy.response.headers['Content-type'] = t

    return r


def header(h, t=None):
    r = cherrypy.response.headers.get(h, None)

    if t is not None:
        cherrypy.response.headers[h] = t

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

    return RequestBody(cherrypy.request.body,
                       cherrypy.request.process_request_body)


def abspath(path):
    if len(path) >= 2 and path[0] == "/" and path[1] == "~":
        path = path[1:]
        comp = path.split(os.path.sep)
        user = os.path.expanduser(comp[0])
        homeroot = os.path.sep.join([user, "tangelo_html"]) + os.path.sep
        path = os.path.abspath(homeroot + os.path.sep.join(comp[1:]))
        if path.find(homeroot) == 0:
            return path
    elif len(path) > 0 and path[0] == "/":
        webroot = cherrypy.config.get("webroot") + os.path.sep
        path = os.path.abspath(webroot + path)
        if path.find(webroot) == 0:
            log("here")
            return path

    return None


def paths(runtimepaths):
    # If a single string is passed in, wrap it into a singleton list (this is
    # important because a string in Python is technically a list of lists, so
    # without this check, this function will treat a single string as a list of
    # single-letter strings - not at all what we expect to happen).
    if type(runtimepaths) in StringTypes:
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

        path = os.path.abspath(cherrypy.thread_data.modulepath + os.path.sep +
                               path)
        if len(path) >= len(root) and path[:len(root)] == root:
            return path

        comp = path.split(os.path.sep)
        if (len(comp) >= len(home) + 2 and
                comp[:len(home)] == home and
                comp[len(home) + 1] == "tangelo_html"):
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
    return copy.deepcopy(cherrypy.config["module-config"]
                                        [cherrypy.thread_data.modulename])


class HTTPStatusCode:
    def __init__(self, code, msg=None):
        self.code = code
        self.msg = msg


# A decorator that exposes functions as being part of a service's RESTful API.
def restful(f):
    f.restful = True
    return f


def types(*_ptypes, **kwtypes):
    """
    Decorate a function that takes strings to one that takes typed values.

    The decorator's arguments are functions to perform type conversion.
    The positional and keyword arguments will be mapped to the positional and
    keyword arguments of the decoratored function.  This allows web-based
    service functions, which by design always are passed string arguments, to be
    declared as functions taking typed arguments instead, eliminating
    the overhead of having to perform type conversions manually.

    If type conversion fails for any argument, the wrapped function will return
    a dict describing the exception that was raised.
    """
    def wrap(f):
        @functools.wraps(f)
        def typed_func(*pargs, **kwargs):
            # Make a list out of the tuple so we can change it below if
            # necessary.
            ptypes = list(_ptypes)

            # Pad out or truncate the typing array to match the length of the
            # function's positional arguments.
            diff = len(pargs) - len(ptypes)
            if diff > 0:
                ptypes += [None] * diff
            elif diff < 0:
                ptypes = ptypes[:len(pargs)]

            # Replace None with the identity function in ptypes.
            def ident(x):
                return x
            ptypes = [ident if x is None else x for x in ptypes]

            try:
                # Map the typing functions over the positional arguments.
                pargs = map(lambda f, v: f(v), ptypes, pargs)

                # Do the same for the keyword arguments by consulting the kwtypes dict.
                for k in kwargs:
                    if k in kwtypes and kwtypes[k] is not None:
                        kwargs[k] = kwtypes[k](kwargs[k])
            except ValueError as e:
                return HTTPStatusCode("400 Input Value Conversion Failed", str(e))

            # Call the wrapped function using the converted arguments.
            return f(*pargs, **kwargs)

        return typed_func
    return wrap


def return_type(rettype):
    """
    Decorate a function to automatically convert its return type to a string
    using a custom function.

    Web-based service functions must return text to the client.  Tangelo
    contains default logic to convert many kinds of values into string, but this
    decorator allows the service writer to specify custom behavior falling
    outside of the default.  If the conversion fails, an appropriate server
    error will be raised.
    """
    def wrap(f):
        @functools.wraps(f)
        def converter(*pargs, **kwargs):
            # Run the function to capture the output.
            result = f(*pargs, **kwargs)

            # Convert the result using the return type function.
            try:
                result = rettype(result)
            except ValueError as e:
                return HTTPStatusCode("500 Return Value Conversion Failed", str(e))
            return result

        return converter
    return wrap
