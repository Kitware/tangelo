import cherrypy

# This service simply echoes back the URL-encoded arguments passed to it.
class Handler:
    def go(self, *pargs, **kwargs):
        response = ""

        # Dump the positional arguments.
        if len(pargs) > 0:
            response += "[" + ", ".join(pargs) + "]\n"

        # Dump the keyword arguments.
        for k in kwargs:
            response += "%s -> %s\n" % (k, kwargs[k])

        # Send the response back.
        if response != "":
            return response
        else:
            return "(No arguments passed)"
