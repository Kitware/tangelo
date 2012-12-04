import cherrypy
import json
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

# 'current_dir' is used by the CherryPy config file to set the root for static
# file service.
import os.path
current_dir = os.path.dirname(os.path.abspath(__file__))

class Server(object):
    @cherrypy.expose
    def index(self):
        # Redirect the user to the actual front page.
        raise cherrypy.HTTPRedirect("/index.html")

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
            response['error'] = "xdataweb: error: no such module '%s'" % (module)
            return json.dumps(response)

        # Report an error if the module has no Handler object.
        m = eval("modules.%s" % (module))
        if 'Handler' not in dir(m):
            response['error'] = "xdataweb: error: no Handler class defined in module '%s'" % (module)
            return json.dumps(response)

        # Construct a Handler object from the imported module.
        handler = m.Handler()

        # Report an error if the Handler object has no go() method.
        if 'go' not in dir(handler):
            response['error'] = "xdataweb: error: no method go() defined in class 'Handler' in module '%s'" % (module)
            return json.dumps(response)

        # Call the go() method of the handler object, passing it the positional
        # and keyword args that came into this method.
        try:
            return handler.go(*pargs, **kwargs)
        except Exception as e:
            response['error'] = "xdataweb: error: %s: %s" % (e.__class__.__name__, e.message)
            return json.dumps(response)

    @cherrypy.expose
    def config(self, module, *pargs, **kwargs):
        cherrypy.response.headers['Content-type'] = 'text/html'

        # Redirect to the appropriately named configuration page, or to a "no
        # configuration" information page if it doesn't exist.
        try:
            # Test whether the requested config app file exists.
            target = current_dir + "/config/%s.html" % (module)
            os.stat(target)

            # Redirect to the config app page.
            raise cherrypy.HTTPRedirect(target)
        except OSError:
            # This code path means the configuration webpage doesn't exist.
            #
            # TODO(choudhury): a templating engine would be useful here; look
            # into Jinja2 (recommended by DJ Deo).
            notfound_text = open(current_dir + "/config/notfound.html").read().replace("[APPNAME]", module)
            return notfound_text
