import json
import os
import subprocess
import time

import cherrypy

import tangelo.websocket

class TangeloVtkweb(object):
    def __init__(self, vtkpython=None, weblauncher=None):
        if vtkpython is None:
            raise TypeError("required argument 'vtkpython' missing")
        elif weblauncher is None:
            raise TypeError("required argument 'weblauncher' missing")

        self.vtkpython = vtkpython
        self.weblauncher = weblauncher

        self.processes = {}

    def shutdown_all(self):
        # TODO(choudhury): remove the entries from the table as the processes
        # are shut down.
        #
        # Terminate the VTK web processes.
        for p in self.processes.values():
            p["process"].terminate()
            p["process"].wait()

    @cherrypy.expose
    def default(self, *pargs, **kwargs):
        # Get keyword arguments.
        progpath = kwargs.get("program", None)
        progargs = kwargs.get("args", "")
        timeout = kwargs.get("timeout", 0)

        # Convert the positional args to a list.
        pargs = list(pargs)

        # Dispatch a RESTful action.
        method = cherrypy.request.method
        if method == "GET":
            # If there is no key argument, send back a list of all the keys.
            if len(pargs) == 0:
                response = self.processes.keys()
            else:
                # Extract the key argument.
                key = pargs[0]

                # Check for the key in the process table.
                if key not in self.processes:
                    return json.dumps({"status": "failed", "reason": "Requested key not in process table"})

                # Retrieve the entry.
                rec = self.processes[key]
                response = { "status": "complete",
                             "process": "running",
                             "port": rec["port"],
                             "stdout": rec["stdout"].readlines(),
                             "stderr": rec["stderr"].readlines() }

                returncode = rec["process"].poll()
                if returncode is not None:
                    # Since the process has ended, delete the process object.
                    del self.processes[key]

                    # Fill out the report response.
                    response["process"] = "terminated"
                    response["returncode"] = returncode

            # Make a report to the user.
            return json.dumps(response)
        elif method == "POST":
            #if len(pargs) == 0:
            if progpath is None or len(progpath) == 0:
                return json.dumps({"status": "incomplete", "reason": "missing 'program' argument (path to vtkweb script)"})

            # Check the user arguments.
            userargs = progargs.split()
            if "--port" in userargs:
                return json.dumps({"status": "incomplete", "reason": "You may not specify --port in this interface"})

            # The program path must begin with a slash (it needs to be an
            # absolute path because we can't evaluate relative paths on the
            # serverside, since we don't know the user's current location).
            if progpath[0] != "/":
                return json.dumps({"status": "incomplete", "reason": "Program path must be an absolute web path"})

            # Verify that the program path is legal (first stripping off the
            # leading slash, since from now on we are considering *disk* paths,
            # while all relative paths are now relative to the web root).
            progpath = progpath[1:]
            if not tangelo.legal_path(progpath)[0]:
                return json.dumps({"status": "incomplete", "reason": "Illegal program URL"})

            # Obtain a filesystem path to the requested program.
            progfile = tangelo.abspath(progpath)

            # Obtain an available port.
            port = tangelo.util.get_free_port()

            # Generate a unique key.
            key = tangelo.util.generate_key(self.processes.keys())

            def launch_failure(msg):
                # On launch failure, report the failure to the user.
                return json.dumps({"status": "failed", "reason": msg})

            # Launch the requested process.
            try:
                cmdline = [self.vtkpython, self.weblauncher, progfile, "--port", str(port)] + userargs
                tangelo.log("starting a vtkweb process: %s" % (" ".join(cmdline)))
                process = subprocess.Popen(cmdline, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            except OSError as e:
                return launch_failure(e.strerror)
            except IOError as e:
                return launch_failure(e.strerror)

            # Capture the new process's stdout and stderr streams in
            # non-blocking readers.
            stdout = tangelo.util.NonBlockingReader(process.stdout)
            stderr = tangelo.util.NonBlockingReader(process.stderr)

            # Read from stdout to look for the signal that the process has
            # started properly.
            class FactoryStarted: pass
            class Failed: pass
            class Timeout: pass
            signal = "Starting factory"
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

                    # If neither failure nor success occurred in the last block of
                    # lines from stdout, either time out, or try again after a short
                    # delay.
                    if wait >= timeout:
                        raise Timeout()

                    wait += sleeptime
                    time.sleep(sleeptime)
            except Timeout:
                return json.dumps({ "status": "failed",
                                    "reason": "process startup timed out" })
            except Failed:
                return json.dumps({ "status": "failed",
                                    "reason": "process did not start up properly",
                                    "stdout": saved_lines,
                                    "stderr": stderr.readlines()})
            except FactoryStarted:
                stdout.pushlines(saved_lines)

            # Create a websocket handler path dedicated to this process.
            host = cherrypy.server.socket_host
            if host == "0.0.0.0":
                host = "localhost"
            wshandler = tangelo.websocket.WebSocketRelay(host, port, key)
            cherrypy.tree.mount(tangelo.websocket.WebSocketHandler(),
                                "/%s" % (key),
                                config={"/ws": { "tools.websocket.on": True,
                                                 "tools.websocket.handler_cls": wshandler,
                                                 "tools.websocket.protocols": ["wamp"] } })

            # Log the new process in the process table, including non-blocking
            # stdout and stderr readers.
            self.processes[key] = { "port": port,
                                           "process": process,
                                           "stdout": stdout,
                                           "stderr": stderr }

            # Form the websocket URL from the hostname/port used in the request,
            # and the newly generated key.
            url = "ws://%s/%s/ws" % (cherrypy.request.base.split("//")[1], key)
            return json.dumps({"status": "complete", "key": key, "url": url})
        elif method == "DELETE":
            # TODO(choudhury): shut down a vtkweb process by key after a given
            # timeout.

            # Make sure there's a key.
            if len(pargs) == 0:
                return json.dumps({"status": "incomplete", "reason": "'key' argument is REQUIRED"})

            # Extract the key.
            key = pargs[0]
            tangelo.log("shutting down %s" % (key))

            # Check for the key in the process table.
            if key not in self.processes:
                tangelo.log("key not found")
                return json.dumps({"status": "failed", "reason": "no such key in process table"})

            # Terminate the process.
            tangelo.log("terminating process")
            proc = self.processes[key]
            proc["process"].terminate()
            proc["process"].wait()
            tangelo.log("terminated")

            # Remove the process entry from the table.
            del self.processes[key]

            return json.dumps({"status": "complete"})
        else:
            raise cherrypy.HTTPError(405, "Method not allowed")
