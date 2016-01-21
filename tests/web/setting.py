import cherrypy


def run(key):
    return cherrypy.config.get(key)
