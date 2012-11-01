import cherrypy

# This service simply echoes back the URL-encoded arguments passed to it.
class Handler:
    def go(self, **kwargs):
        cherrypy.response.headers['Content-type'] = 'text/plain'
        response = ""
        for k in kwargs:
            response += "%s -> %s\n" % (k, kwargs[k])

        if response != "":
            return response
        else:
            return "(No arguments passed)"

