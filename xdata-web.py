import cherrypy
import sys

class Server(object):
    @cherrypy.expose
    def index(self):
        return """<!doctype html>
<meta charset=utf-8>
<h1>XDATA Web (running over CherryPy)</h1>"""
    
    @cherrypy.expose
    def app(self, module, *pargs, **kwargs):
        # TODO(choudhury): This method should attempt to load the named module, then invoke it
        # with the given arguments.  However, if the named module is "config" or
        # something similar, the method should instead launch a special "config"
        # app, which lists the available app modules, along with docstrings or
        # similar.  It should also allow the user to add/delete search paths for
        # other modules.
        cherrypy.response.headers['Content-type'] = 'text/plain'

        response = ""
#         response = "requested app '%s' with positional args " % (module) + str(pargs)
#         response += " and keyword args " + str(kwargs) + "\n"

        # Construct import statement.
        import_string = "import modules.%s" % (module)
        try:
            exec(import_string)
        except ImportError:
            response += "\nError: no such module '%s'" % (module)
            return response

        # Construct a Handler object from the module.
        try:
            handler = eval("modules.%s.Handler()" % (module))
        except AttributeError:
            response += "\nError: no Handler class defined in module '%s'" % (module)
            return response

        # Call the go() method of the handler object, passing it the positional
        # and keyword args that came into this method.
        try:
            response += handler.go(*pargs, **kwargs)
        except AttributeError:
            response += "\nError: no method go() defined in class Handler in module '%s'" % (module)
            return response
        except TypeError as e:
            response += "\nError: " + str(e)
            return response

        # If we reach here, then return the full result of running the module.
        return response

if __name__ == "__main__":
    port = 80
    if len(sys.argv) >= 2:
      try:
        port = int(sys.argv[1])
      except ValueError:
        sys.stderr.write("error: %s is not a valid port number\n" % (sys.argv[1]))
        sys.exit(1)

    cherrypy.config.update({
      'server.socket_port' : port
    })
    cherrypy.quickstart(Server())
