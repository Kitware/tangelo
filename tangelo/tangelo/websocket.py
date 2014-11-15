import cherrypy
from ws4py.server.cherrypyserver import WebSocketPlugin


class WebSocketLowPriorityPlugin(WebSocketPlugin):
    def __init__(self, *pargs, **kwargs):
        WebSocketPlugin.__init__(self, *pargs, **kwargs)

    # This version of start() differs only in that it has an assigned priority.
    # The default priority is 50, which is what the actual WebSocketPlugin's
    # start method gets, which means it runs before the privilege drop gets a
    # chance to (priority 77, slightly lower than the 75 of the engine start
    # itself).  For some reason if this runs before the priv drop, things get
    # screwed up.
    def start(self):
        WebSocketPlugin.start(self)
    start.priority = 80


def mount(name, handler_cls, protocols=None):
    class WebSocketHandler(object):
        @cherrypy.expose
        def index(self):
            pass

        @cherrypy.expose
        def ws(self):
            pass

    if protocols is None:
        protocols = []
    elif not isinstance(protocols, list):
        protocols = [protocols]

    cherrypy.tree.mount(WebSocketHandler(),
                        "/ws/%s" % (name),
                        config={"/ws": {"tools.websocket.on": True,
                                        "tools.websocket.handler_cls": handler_cls,
                                        "tools.websocket.protocols": protocols}})


def unmount(name):
    try:
        del cherrypy.tree.apps["/ws/%s" % (name)]
    except KeyError:
        raise KeyError("no such websocket path: %s" % (name))
