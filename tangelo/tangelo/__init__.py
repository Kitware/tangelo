import __builtin__
import cherrypy
import copy
import functools
import imp
import inspect
import os.path
import logging
import sys
from types import StringTypes

import tangelo.util

builtin_import = __builtin__.__import__


def content_type(t=None):
    r = cherrypy.response.headers["Content-type"]

    if t is not None:
        cherrypy.response.headers["Content-type"] = t

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


class _Redirect(object):
    def __init__(self, path, status):
        self.path = path
        self.status = status


def redirect(path, status=303):
    return _Redirect(path, status)


class _InternalRedirect(object):
    def __init__(self, path):
        self.path = path


def internal_redirect(path):
    return _InternalRedirect(path)


class _File(object):
    def __init__(self, path, content_type):
        self.path = path
        self.content_type = content_type


def file(path, content_type="application/octet-stream"):
    return _File(os.path.abspath(path), content_type)


def log(section, message=None, color=None, lvl=logging.INFO):
    if message is None:
        message = section
        section = "TANGELO"

    if not tangelo.util.windows() and color is not None:
        section = "%s%s" % (color, section)
        message = "%s%s" % (message, "\033[0m")

    # There is a subtle difference between cherrypy.log and cherrypy.log.error,
    # even though one just calls the other via a __call__ method.  For reasons I
    # don't understand, the cherrypy.log message seems to have an extra limit to
    # log levels of logging.INFO, whereas cherrypy.log.error honors the log
    # level that can be set.
    cherrypy.log.error(str(message), section, lvl)


def log_critical(section, message=None):
    log(section, message, color="\033[1;91m", lvl=logging.CRITICAL)


def log_error(section, message=None):
    log(section, message, color="\033[31m", lvl=logging.ERROR)


def log_warning(section, message=None):
    log(section, message, color="\033[33m", lvl=logging.WARNING)


def log_info(section, message=None):
    log(section, message, color="\033[35m", lvl=logging.INFO)


def log_debug(section, message=None):
    log(section, message, color="\033[1;34m", lvl=logging.DEBUG)


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


def paths(runtimepaths):
    # If a single string is passed in, wrap it into a singleton list (this is
    # important because a string in Python is technically a list of lists, so
    # without this check, this function will treat a single string as a list of
    # single-letter strings - not at all what we expect to happen).
    if type(runtimepaths) in StringTypes:
        runtimepaths = [runtimepaths]

    home = os.path.expanduser("~").split(os.path.sep)[:-1]
    root = os.path.abspath(cherrypy.config.get("webroot"))

    # This function returns an absolute path if the path is allowed (i.e., in
    # someone's tangelo_html directory, or under the web root directory), or
    # logs a complaint and returns None otherwise.
    def good(path):
        orig = path
        if os.path.isabs(path):
            log("Illegal path (absolute): %s" % (orig), "SERVICE")
            return None

        path = os.path.abspath(os.path.join(cherrypy.thread_data.modulepath, path))
        if path == root or path.startswith(root + os.path.sep):
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

    # Use the import lock to have some thread safety
    imp.acquire_lock()
    # Exclude paths we've already added to the system
    newpaths = [path for path in newpaths if path not in sys.path]
    # Finally, augment the path list.
    sys.path = newpaths + sys.path
    imp.release_lock()


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


def tangelo_import(*args, **kwargs):
    """
    When we are asked to import a module, if we get an import error and the
    calling script is one we are serving (not one in the python libraries), try
    again in the same directory as the script that is calling import.
        It seems like we should use sys.meta_path and combine our path with the
    path sent to imp.find_module.  This requires duplicating a bunch of logic
    from the imp module and is actually heavier than this technique.

    :params: see __builtin__.__import__
    """
    try:
        return builtin_import(*args, **kwargs)
    except ImportError:
        if not hasattr(cherrypy.thread_data, "modulepath"):
            raise
        path = os.path.abspath(cherrypy.thread_data.modulepath)
        root = os.path.abspath(cherrypy.config.get("webroot"))
        result = None
        imp.acquire_lock()
        oldpath = sys.path
        try:
            # If the module's path isn't in the system path but is in our
            # serving area, temporarily add it and try the import again.
            if path not in sys.path and (path == root or path.startswith(root + os.path.sep)):
                sys.path = [path] + sys.path
                result = builtin_import(*args, **kwargs)
        finally:
            sys.path = oldpath
            imp.release_lock()
        if result is not None:
            return result
        raise
    # Any other exception will be raised, so we don't try to return anything.


# Direct imports through our own function
__builtin__.__import__ = tangelo_import
