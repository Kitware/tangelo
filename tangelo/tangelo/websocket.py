import threading
import cherrypy
import ws4py.server.cherrypyserver
import ws4py.websocket
import tangelo.autobahn.websocket as ab_websocket
import tangelo.autobahn.wamp as wamp
import twisted.internet

import tangelo

class WebSocketLowPriorityPlugin(ws4py.server.cherrypyserver.WebSocketPlugin):
    def __init__(self, *pargs, **kwargs):
        ws4py.server.cherrypyserver.WebSocketPlugin.__init__(self, *pargs, **kwargs)

    # This version of start() differs only in that it has an assigned priority.
    # The default priority is 50, which is what the actual WebSocketPlugin's
    # start method gets, which means it runs before the privilege drop gets a
    # chance to (priority 77, slightly lower than the 75 of the engine start
    # itself).  For some reason if this runs before the priv drop, things get
    # screwed up.
    def start(self):
        ws4py.server.cherrypyserver.WebSocketPlugin.start(self)
    start.priority = 80

class WebSocketHandler(object):
    @cherrypy.expose
    def index(self):
        return "OK"

    @cherrypy.expose
    def ws(self):
        pass

def VTKWebSocketAB(url, relay):
    class RegisteringWebSocketClientFactory(wamp.WampClientFactory):
        def register(self, client):
            self.client = client

    class Protocol(wamp.WampClientProtocol):
        def onOpen(self):
            self.factory.register(self)

        def onMessage(self, msg, is_binary):
            relay.send(msg)

    class Connection(threading.Thread):
        def run(self):
            self.factory = RegisteringWebSocketClientFactory(url)
            self.factory.protocol = Protocol
            twisted.internet.reactor.callFromThread(ab_websocket.connectWS, self.factory)

        def send(self, data):
            twisted.internet.reactor.callFromThread(Protocol.sendMessage, self.factory.client, data)

    c = Connection()
    c.start()
    return c

def WebSocketRelay(hostname, port, key):
    class Class(ws4py.websocket.WebSocket):
        def __init__(self, *pargs, **kwargs):
            ws4py.websocket.WebSocket.__init__(self, *pargs, **kwargs)

            url = "ws://%s:%d/ws" % (hostname, port)

            tangelo.log("websocket created at %s:%d/%s (proxy to %s)" % (hostname, port, key, url))

            self.client = VTKWebSocketAB(url, self)

        def closed(self, code, reason=None):
            # TODO(choudhury): figure out if recovery, etc. is possible if the
            # socket is closed for some reason.
            tangelo.log("websocket at %s:%d/%s closed with code %d (%s)" % (hostname, port, key, code, reason))

        def received_message(self, msg):
            self.client.send(msg.data)

    return Class
