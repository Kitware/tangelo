import cherrypy
import os
import tangelo
import tangelo.util
from tangelo.server import analyze_url
from tangelo.server import Content
import autobahn.websocket as ab_websocket
import autobahn.wamp as wamp
import twisted.internet.reactor
import subprocess
import threading
import ws4py
import sys
import time

vtkpython = None
weblauncher = None


def initialize():
    global vtkpython
    global weblauncher

    # Get the module config.
    config = tangelo.plugin_config()

    # Raise an error if there's no vtkpython executable.
    vtkpython = config.get("vtkpython", None)
    if not vtkpython:
        msg = "No 'vtkpython' option specified in configuration plugin"
        tangelo.log_warning("VTKWEB", "[initialization] fatal error: %s" % (msg))

        # Construct a run() function that will mask the restful API and just
        # inform the caller about the configuration problem.
        def run():
            tangelo.http_status(400, "Bad Configuration")
            return {"error": msg}

        sys.modules[__name__].__dict__["run"] = run
        return

    vtkpython = tangelo.util.expandpath(vtkpython)
    tangelo.log("VTKWEB", "[initialization] Using vtkpython executable %s" % (vtkpython))

    # Use the "web launcher" included with the plugin.
    weblauncher = os.path.realpath("%s/../include/vtkweb-launcher.py" % (os.path.dirname(__file__)))

    # Initialize a table of VTKWeb processes.
    if tangelo.plugin_store().get("processes") is None:
        tangelo.plugin_store()["processes"] = {}

    # Check to see if a reactor is running already.
    if twisted.internet.reactor.running:
        threads = [t for t in threading.enumerate() if t.name == "tangelo-vtkweb-plugin"]
        if len(threads) > 0:
            tangelo.log_warning(
                "VTKWEB",
                "[initialization] A reactor started by a "
                "previous loading of this plugin is already running"
            )
        else:
            tangelo.log_warning(
                "VTKWEB",
                "[initialization] A reactor started by someone other "
                "than this plugin is already running"
            )
    else:
        # Start the Twisted reactor, but in a separate thread so it doesn't
        # block the CherryPy main loop.  Mark the thread as "daemon" so that
        # when Tangelo's main thread exits, the reactor thread will be killed
        # immediately.
        reactor = threading.Thread(
            target=twisted.internet.reactor.run,
            kwargs={"installSignalHandlers": False},
            name="tangelo-vtkweb-plugin"
        )
        reactor.daemon = True
        reactor.start()

        tangelo.log_info("VTKWEB", "[initialization] Starting Twisted reactor")

initialize()


@tangelo.restful
def get(key=None):

    processes = tangelo.plugin_store()["processes"]

    # If no key was supplied, return list of running processes.
    if key is None:
        return processes.keys()

    # Error for bad key.
    if key not in processes:
        tangelo.http_status(400, "No Such Process Key")
        return {"error": "Requested key not in process table"}

    # Retrieve the process entry.
    rec = processes[key]
    response = {"status": "complete",
                "process": "running",
                "port": rec["port"],
                "stdout": rec["stdout"].readlines(),
                "stderr": rec["stderr"].readlines()}

    # Check the status of the process.
    returncode = rec["process"].poll()
    if returncode is not None:
        # Since the process has ended, delete the process object.
        del processes[key]

        # Fill out the report response.
        response["process"] = "terminated"
        response["returncode"] = returncode

    return response


@tangelo.restful
def post(*pargs, **query):
    args = query.get("args", "")
    timeout = float(query.get("timeout", 0))

    processes = tangelo.plugin_store()["processes"]

    if len(pargs) == 0:
        tangelo.http_status(400, "Required Argument Missing")
        return {"error": "No program path was specified"}

    program_url = "/" + "/".join(pargs)

    content = analyze_url(program_url).content
    if content is None or content.type not in (Content.File, Content.Restricted):
        tangelo.http_status(404, "Not Found")
        return {"error": "Could not find a script at %s" % (program_url)}

    program = content.path

    # Check the user arguments.
    userargs = args.split()
    if "--port" in userargs:
        tangelo.http_status(400, "Illegal Argument")
        return {"error": "You may not specify '--port' among the arguments passed in 'args'"}

    # Obtain an available port.
    port = tangelo.util.get_free_port()

    # Generate a unique key.
    key = tangelo.util.generate_key(processes.keys())

    # Detect http vs. https
    scheme = "ws"
    ssl_key = cherrypy.config.get("server.ssl_private_key")
    ssl_cert = cherrypy.config.get("server.ssl_certificate")

    # Generate command line.
    cmdline = [vtkpython, weblauncher, program, "--port", str(port)] + userargs
    if ssl_key and ssl_cert:
        scheme = "wss"
        cmdline.extend(["--sslKey", ssl_key, "--sslCert", ssl_cert])

    # Launch the requested process.
    tangelo.log_info("VTKWEB", "Starting process: %s" % (" ".join(cmdline)))
    try:
        process = subprocess.Popen(cmdline,
                                   stdout=subprocess.PIPE,
                                   stderr=subprocess.PIPE)
    except (OSError, IOError) as e:
        tangelo.log_warning("VTKWEB", "Error: could not launch VTKWeb process")
        return {"error": e.strerror}

    # Capture the new process's stdout and stderr streams in
    # non-blocking readers.
    stdout = tangelo.util.NonBlockingReader(process.stdout)
    stderr = tangelo.util.NonBlockingReader(process.stderr)

    # Read from stdout to look for the signal that the process has
    # started properly.
    class FactoryStarted:
        pass

    class Failed:
        pass

    class Timeout:
        pass
    signal = "Starting factory"
    if timeout <= 0:
        timeout = 10
    sleeptime = 0.5
    wait = 0
    saved_lines = []
    try:
        while True:
            lines = stdout.readlines()
            saved_lines += lines
            for line in lines:
                if line == "":
                    # This indicates that stdout has closed without
                    # starting the process.
                    raise Failed()
                elif signal in line:
                    # This means that the server has started.
                    raise FactoryStarted()

            # If neither failure nor success occurred in the last block
            # of lines from stdout, either time out, or try again after
            # a short delay.
            if wait >= timeout:
                raise Timeout()

            wait += sleeptime
            time.sleep(sleeptime)
    except Timeout:
        tangelo.http_status(524, "Timeout")
        return {"error": "Process startup timed out"}
    except Failed:
        tangelo.http_status(500)
        return {"error": "Process did not start up properly",
                "stdout": saved_lines,
                "stderr": stderr.readlines()}
    except FactoryStarted:
        stdout.pushlines(saved_lines)

    # Create a websocket handler path dedicated to this process.
    host = "localhost" if cherrypy.server.socket_host == "0.0.0.0" else cherrypy.server.socket_host
    tangelo.websocket.mount(key, WebSocketRelay(host, port, key), "wamp")

    # Log the new process in the process table, including non-blocking
    # stdout and stderr readers.
    processes[key] = {"port": port,
                      "process": process,
                      "stdout": stdout,
                      "stderr": stderr}

    # Form the websocket URL from the hostname/port used in the
    # request, and the newly generated key.
    url = "%s://%s/ws/%s/ws" % (scheme, cherrypy.request.base.split("//")[1], key)
    return {"key": key,
            "url": url}


@tangelo.restful
def delete(key=None):
    # TODO(choudhury): shut down a vtkweb process by key after a given timeout.

    processes = tangelo.plugin_store()["processes"]

    if key is None:
        tangelo.http_status(400, "Required Argument Missing")
        return {"error": "'key' argument is required"}

    # Check for the key in the process table.
    if key not in processes:
        tangelo.http_status(400, "Key Not Found")
        return {"error": "Key %s not in process table" % (key)}

    # Terminate the process.
    tangelo.log_info("VTKWEB", "Shutting down process %s" % (key))
    proc = processes[key]
    proc["process"].terminate()
    proc["process"].wait()
    tangelo.log_success("VTKWEB", "Process terminated")

    # Remove the process entry from the table.
    del processes[key]

    return {"key": key}


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
            twisted.internet.reactor.callFromThread(ab_websocket.connectWS,
                                                    self.factory)

        def send(self, data):
            twisted.internet.reactor.callFromThread(Protocol.sendMessage,
                                                    self.factory.client,
                                                    data)

    c = Connection()
    c.start()
    return c


def WebSocketRelay(hostname, port, key):
    class Class(ws4py.websocket.WebSocket):
        def __init__(self, *pargs, **kwargs):
            ws4py.websocket.WebSocket.__init__(self, *pargs, **kwargs)

            scheme = "ws"
            if cherrypy.config.get("server.ssl_private_key"):
                scheme = "wss"
            url = "%s://%s:%d/ws" % (scheme, hostname, port)

            tangelo.log_info(
                "VTKWEB",
                "websocket created at %s:%d/%s (proxy to %s)" % (hostname, port, key, url)
            )

            self.client = VTKWebSocketAB(url, self)

        def closed(self, code, reason=None):
            # TODO(choudhury): figure out if recovery, etc. is possible if the
            # socket is closed for some reason.
            tangelo.log_info(
                "VTKWEB",
                "websocket at %s:%d/%s closed with code %d (%s)" % (
                    hostname, port, key, code, reason
                )
            )

        def received_message(self, msg):
            self.client.send(msg.data)

    return Class
