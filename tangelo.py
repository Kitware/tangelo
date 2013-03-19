import bson.json_util
import cherrypy
import json
import StringIO
import sys
import traceback

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

# Convenience functions to use in the modules - this avoids having to import the
# bson module everywhere.
#
# Take a python object, and serialize it to JSON text.
def dumps(r):
    return bson.json_util.dumps(r)

# Take a JSON text string, and extract a python object from it.
def loads(s):
    return bson.json_util.loads(s)

# 'current_dir' is used by the CherryPy config file to set the root for static
# file service.
import os.path
current_dir = os.path.dirname(os.path.abspath(__file__))

class Server(object):
    @cherrypy.expose
    def default(self, *path):
        # If there are no positional arguments, behave as though the root
        # index.html was requested.
        if len(path) == 0:
            cherrypy.log("no path")
            path = ["index.html"]

        # Check the first character of the first path component.  If it's a
        # tilde, then assume the path points into a user's home directory.
        if path[0][0] == "~":
            # Make sure there is a username after the tilde.
            if len(path[0]) == 1:
                cherrypy.log("only tilde")
                raise cherrypy.HTTPError(404)

            # Get the actual path corresponding to the tilde-name (after
            # converting the positional args tuple to a list so we can assign to
            # its elements).

            #path = list(path)
            userpath = os.path.expanduser(path[0]) + "/tangelo_html"

            # Check to make sure there was an actual user by that name - if it
            # wasn't, the function will not change the input and it will still
            # have a tilde in the first position.
            if userpath[0] == "~":
                cherrypy.log("no user: " + userpath)
                raise cherrypy.HTTPError(404)

            cherrypy.log("serving user dir: " + "/".join(path))
            return serve_file(userpath + "/" +  "/".join(path[1:]))
        else:
            cherrypy.log("serving from root: " + current_dir + "/web/" + "/".join(path))
            return serve_file(current_dir + "/web/" + "/".join(path))

    @cherrypy.expose
    def service(self, module, *pargs, **kwargs):
        # TODO(choudhury): This method should attempt to load the named module, then invoke it
        # with the given arguments.  However, if the named module is "config" or
        # something similar, the method should instead launch a special "config"
        # app, which lists the available app modules, along with docstrings or
        # similar.  It should also allow the user to add/delete search paths for
        # other modules.
        cherrypy.response.headers['Content-type'] = 'text/plain'

        # Construct a response container for reporting possible errors, as the
        # service modules themselves do.
        response = empty_response()

        # Construct import statement.
        import_string = "import modules.%s" % (module)
        try:
            exec(import_string)
        except ImportError:
            response['error'] = "tangelo: error: no such module '%s'" % (module)
            return json.dumps(response)

        # Report an error if the module has no Handler object.
        m = eval("modules.%s" % (module))
        if 'Handler' not in dir(m):
            response['error'] = "tangelo: error: no Handler class defined in module '%s'" % (module)
            return json.dumps(response)

        # Construct a Handler object from the imported module.
        handler = m.Handler()

        # Report an error if the Handler object has no go() method.
        if 'go' not in dir(handler):
            response['error'] = "tangelo: error: no method go() defined in class 'Handler' in module '%s'" % (module)
            return json.dumps(response)

        # Call the go() method of the handler object, passing it the positional
        # and keyword args that came into this method.
        try:
            return handler.go(*pargs, **kwargs)
        except Exception as e:
            # Error message.
            response['error'] = "tangelo: error: %s: %s" % (e.__class__.__name__, e.message)

            cherrypy.log("Caught exception - %s: %s" % (e.__class__.__name__, e.message))

            # Full Python traceback stack.
            s = StringIO.StringIO()
            traceback.print_exc(file=s)
            if 'traceback' in response:
                response['traceback'] += "\n" + s.getvalue()
            else:
                response['traceback'] = "\n" + s.getvalue()

            # Serialize to JSON.
            return json.dumps(response)
