import cherrypy
import imp
import json
import StringIO
import sys
import traceback
import types

from cherrypy.lib.static import serve_file

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

def log(msg):
    cherrypy.log(msg)

# 'current_dir' is used by the CherryPy config file to set the root for static
# file service.
import os.path
current_dir = os.path.dirname(os.path.abspath(__file__))

def invoke_service(module, *pargs, **kwargs):
    # TODO(choudhury): This method should attempt to load the named module, then invoke it
    # with the given arguments.  However, if the named module is "config" or
    # something similar, the method should instead launch a special "config"
    # app, which lists the available app modules, along with docstrings or
    # similar.  It should also allow the user to add/delete search paths for
    # other modules.
    content_type("text/plain")

    # Construct a response container for reporting possible errors, as the
    # service modules themselves do.
    response = empty_response()

    # Import the module.
    try:
        service = imp.load_source("service", module)
    except IOError as e:
        log("error: " + module)
        response['error'] = "IOError: %s" % (e)
        return json.dumps(response)

    # Report an error if the Handler object has no go() method.
    if 'run' not in dir(service):
        response['error'] = "tangelo: error: no function `run()` defined in module '%s'" % (module)
        return json.dumps(response)

    # Call the module's run() method, passing it the positional and keyword args
    # that came into this method.
    try:
        result = service.run(*pargs, **kwargs)

        # Check the type of the result - if it's anything other than a string,
        # assume it needs to be converted to JSON.
        #
        # This allows the services to return a Python object if they wish, or to
        # perform custom serialization (such as for MongoDB results, etc.).
        if not isinstance(result, types.StringTypes):
            result = json.dumps(result)

        return result
    except Exception as e:
        # Error message.
        response['error'] = "tangelo: error: %s: %s" % (e.__class__.__name__, e.message)

        log("Caught exception - %s: %s" % (e.__class__.__name__, e.message))

        # Full Python traceback stack.
        s = StringIO.StringIO()
        traceback.print_exc(file=s)
        if 'traceback' in response:
            response['traceback'] += "\n" + s.getvalue()
        else:
            response['traceback'] = "\n" + s.getvalue()

        # Serialize to JSON.
        return json.dumps(response)

class Server(object):
    @cherrypy.expose
    def default(self, *path, **args):
        # Convert the path argument into a list (from a tuple).
        path = list(path)

        # If there are no positional arguments, behave as though the root
        # index.html was requested.
        if len(path) == 0:
            path = ["index.html"]

        # Check the first character of the first path component.  If it's a
        # tilde, then assume the path points into a user's home directory.
        if path[0][0] == "~":
            # Only treat this component as a home directory if there is actually
            # text following the tilde (rather than making the server serve
            # files from the home directory of whatever user account it is using
            # to run).
            if len(path[0]) > 1:
                # Expand the home directory, append the tangelo_html
                # subdirectory, and then the tail of the original path.
                path = os.path.expanduser(path[0]).split("/") + ["tangelo_html"] + path[1:]
        else:
            # TODO(choudhury): check a table of configured custom mappings to
            # see if the first path component should be mapped to some other
            # filesystem path.

            # Reaching this point means the path is relative to the server's web
            # root.
            path = current_dir.split("/") + ["web"] + path

        # Check for the word "service" in the path - this indicates the
        # invocation of a web service placed somewhere besides the global
        # services list.
        try:
            service = path.index("service")

            # Make sure there is an actual service name after the "service" path
            # component.
            if len(path) == service + 1:
                raise cherrypy.HTTPError(404, "Did you forget the service name?")

            # Grab the portion of the path that names the service (appending the
            # standard python file extension as well).
            service_path = "/".join(path[:(service+2)]) + ".py"

            # Grab the rest of the path list, as the positional arguments for
            # the service invocation.
            pargs = path[(service+2):]

            # Invoke the service and return the result.
            return invoke_service(service_path, *pargs, **args)
        except ValueError:
            pass

        # Form a path name from the path components.
        finalpath = "/".join(path)

        # If the path represents a directory, first check if the URL is missing
        # a trailing slash - if it is, redirect to a URL with the slash
        # appended; otherwise, append "index.html" to the path spec and
        # continue.
        if os.path.isdir(finalpath):
            if cherrypy.request.path_info[-1] != "/":
                raise cherrypy.HTTPRedirect(cherrypy.request.path_info + "/")
            else:
                finalpath += "/index.html"

        # If the home directory expansion above failed (or something else went
        # wrong), then the filepath will not be an absolute path, and we bail.
        if not os.path.isabs(finalpath):
            raise cherrypy.HTTPError(404)

        # Serve the file.
        return serve_file(finalpath)
