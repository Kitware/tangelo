import tangelo
import tangelo.autobahn.websocket as ab_websocket
import tangelo.autobahn.wamp as wamp
import twisted.internet
import threading

vtkpython = None
weblauncher = None
processes = {}


@tangelo.restful
def get(key=None):
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
def post(*pargs, args="", timeout=0):
    if len(pargs) == 0:
        tangelo.http_status(400, "Required Argument Missing")
        return {"error": "No program path was specified"}

    program_url = "/" + "/".join(pargs)

    directive = tangelo.tool.analyze_url(program_url)
    if directive["target"].get("type") != "restricted":
        tangelo.http_status(404, "Not Found")
        return {"error": "Could not find a script at %s" % (program_url)}

    program = directive["target"]["path"]

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
    tangelo.log("VTKWEB", "Starting process: %s" % (" ".join(cmdline)))
    try:
        process = subprocess.Popen(cmdline,
                                   stdout=subprocess.PIPE,
                                   stderr=subprocess.PIPE)
    except (OSError, IOError) as e:
        tangelo.log("VTKWEB", "Error:  could not launch VTKWeb process")
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

    if key is None:
        tangelo.http_status(400, "Required Argument Missing")
        return {"error": "'key' argument is required"}

    # Check for the key in the process table.
    if key not in processes:
        tangelo.http_status(400, "Key Not Found")
        return {"error": "Key %s not in process table" % (key)}

    # Terminate the process.
    tangelo.log("VTKWEB", "Shutting down process %s" % (key))
    proc = processes[key]
    proc["process"].terminate()
    proc["process"].wait()
    tangelo.log("VTKWEB", "Process terminated")

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
    class Class(tangelo.ws4py.websocket.WebSocket):
        def __init__(self, *pargs, **kwargs):
            tangelo.ws4py.websocket.WebSocket.__init__(self, *pargs, **kwargs)

            scheme = "ws"
            if cherrypy.config.get("server.ssl_private_key"):
                scheme = "wss"
            url = "%s://%s:%d/ws" % (scheme, hostname, port)

            tangelo.log("VTKWEB", "websocket created at %s:%d/%s (proxy to %s)" %
                        (hostname, port, key, url))

            self.client = VTKWebSocketAB(url, self)

        def closed(self, code, reason=None):
            # TODO(choudhury): figure out if recovery, etc. is possible if the
            # socket is closed for some reason.
            tangelo.log("VTKWEB", "websocket at %s:%d/%s closed with code %d (%s)" %
                        (hostname, port, key, code, reason))

        def received_message(self, msg):
            self.client.send(msg.data)

    return Class
