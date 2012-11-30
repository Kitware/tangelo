import cherrypy
import sys
import xdataweb

# 'current_dir' is used by the CherryPy config file to set the root for static
# file service.
import os.path
current_dir = os.path.dirname(os.path.abspath(__file__))

class Server(object):
    @cherrypy.expose
    def index(self):
        return """<!doctype html>
<meta charset=utf-8>
<h1>XDATA Web (running over CherryPy)</h1>"""
    
    @cherrypy.expose
    def service(self, module, *pargs, **kwargs):
        # TODO(choudhury): This method should attempt to load the named module, then invoke it
        # with the given arguments.  However, if the named module is "config" or
        # something similar, the method should instead launch a special "config"
        # app, which lists the available app modules, along with docstrings or
        # similar.  It should also allow the user to add/delete search paths for
        # other modules.
        cherrypy.response.headers['Content-type'] = 'text/plain'

        # TODO(choudhury): for reporting errors, construct a response container
        # to stuff the message in, as the service modules themselves do.
        #
        # Construct import statement.
        import_string = "import modules.%s" % (module)
        try:
            exec(import_string)
        except ImportError:
            return "Error: no such module '%s'" % (module)

        # Report an error if the module has no Handler object.
        m = eval("modules.%s" % (module))
        if 'Handler' not in dir(m):
            return "Error: no Handler class defined in module '%s'" % (module)

        # Construct a Handler object from the imported module.
        handler = m.Handler()

        # Report an error if the Handler object has no go() method.
        if 'go' not in dir(handler):
            return "Error: no method go() defined in class 'Handler' in module '%s'" % (module)

        # Call the go() method of the handler object, passing it the positional
        # and keyword args that came into this method.
        try:
            return handler.go(*pargs, **kwargs)
        except Exception as e:
            return "Error: %s: %s" % (e.__class__.__name__, e.message)
