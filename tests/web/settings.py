import cherrypy
import tangelo


# This service reports the value of cherrypy's thread pool setting
def run(**kwargs):
    if kwargs.get('pool'):
        tangelo.util.set_server_setting('server.thread_pool', int(kwargs['pool']))
    response = 'pool="%r"' % cherrypy.config.get('server.thread_pool')
    return response
