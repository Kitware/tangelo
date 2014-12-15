import cherrypy
import copy
import functools
import inspect
import os.path
import sys
from types import StringTypes

import tangelo.util


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


def request_header(h):
    return cherrypy.request.headers.get(h)


def http_status(code, message=None):
    cherrypy.response.status = "%s%s" % (code, " %s" % (message) if message is not None else "")


def log(section, message=None, color=None):
    if message is None:
        message = section
        section = "TANGELO"

    if not tangelo.util.windows() and color is not None:
        section = "%s%s%s" % (color, section, "\033[0m")
        message = "%s%s%s" % (color, message, "\033[0m")

    cherrypy.log(str(message), section)


def log_error(section, message=None):
    log(section, message, color="\033[1;91m")


def log_success(section, message=None):
    log(section, message, color="\033[32m")


def log_warning(section, message=None):
    log(section, message, color="\033[1;33m")


def log_info(section, message=None):
    log(section, message, color="\033[35m")


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


def session(key, value=None):
    r = cherrypy.session.get(key)

    if value is not None:
        cherrypy.session[key] = value

    return r


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
    return copy.deepcopy(cherrypy.config["module-config"][cherrypy.thread_data.modulename])


def plugin_config():
    return copy.deepcopy(cherrypy.config["plugin-config"][cherrypy.thread_data.pluginpath])


def store():
    return cherrypy.config["module-store"][cherrypy.thread_data.modulename]


def plugin_store():
    return cherrypy.config["plugin-store"][cherrypy.thread_data.pluginpath]


# A decorator that exposes functions as being part of a service's RESTful API.
def restful(f):
    f.restful = True
    return f


def types(**typefuncs):
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
            # Analyze the incoming arguments so we know how to apply the
            # type-conversion functions in `typefuncs`.
            argspec = inspect.getargspec(f)

            # The `args` property contains the list of named arguments passed to
            # f.  Construct a dict mapping from these names to the values that
            # were passed.
            #
            # It is possible that `args` contains names that are not represented
            # in `pargs`, if some of the arguments are passed as keyword
            # arguments.  In this case, the relative shortness of `pargs` will
            # cause the call to zip() to truncate the `args` list, and the
            # keyword-style passed arguments will simply be present in `kwargs`.
            pargs_dict = {name: value for (name, value) in zip(argspec.args, pargs)}

            # Begin converting arguments according to the functions given in
            # `typefuncs`.  If a given name does not appear in `typefuncs`,
            # simply leave it unchanged.  If a name appears in `typefuncs` that
            # does not appear in the argument list, this is considered an error.
            try:
                for name, func in typefuncs.iteritems():
                    if name in pargs_dict:
                        pargs_dict[name] = func(pargs_dict[name])
                    elif name in kwargs:
                        kwargs[name] = func(kwargs[name])
                    else:
                        http_status(400, "Unknown Argument Name")
                        content_type("application/json")
                        return {"error": "'%s' was registered for type conversion but did not appear in the arguments list" % (name)}
            except ValueError as e:
                http_status(400, "Input Value Conversion Failed")
                content_type("application/json")
                return {"error": str(e)}

            # Unroll `pargs` into a list of arguments that are in the correct
            # order.
            pargs = []
            for name in argspec.args:
                try:
                    pargs.append(pargs_dict[name])
                except KeyError:
                    break

            # Call the wrapped function using the converted arguments.
            return f(*pargs, **kwargs)

        typed_func.typefuncs = typefuncs
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
                http_status(500, "Return Value Conversion Failed")
                content_type("application/json")
                return {"error": str(e)}
            return result

        return converter
    return wrap
