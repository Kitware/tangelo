import cherrypy
import sys
import xdataweb

# current_dir is used by the CherryPy config file to set the root for static
# file service; sys.path is extended with this path to prevent
# daemonization of this server (which changes the CWD to "/") from interfering
# with dynamic module loading.
import os.path
current_dir = os.path.dirname(os.path.abspath(__file__))
print current_dir
sys.path.append(current_dir)

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

        response = ""

        # Construct import statement.
        import_string = "import modules.%s" % (module)
        try:
            exec(import_string)
        except ImportError:
            return "Error: no such module '%s'" % (module)

        # Construct a Handler object from the module.
        try:
            handler = eval("modules.%s.Handler()" % (module))
        except AttributeError:
            return "Error: no Handler class defined in module '%s'" % (module)

        # Call the go() method of the handler object, passing it the positional
        # and keyword args that came into this method.
        try:
            return handler.go(*pargs, **kwargs)
        except AttributeError:
            return "Error: no method go() defined in class Handler in module '%s'" % (module)
        except TypeError as e:
            return "Error: " + str(e)
