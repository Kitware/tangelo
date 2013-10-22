import datetime
import sys
import HTMLParser
import os
import cherrypy
import json
from minify_json import json_minify
import imp
import traceback
import md5
import types
import subprocess
import time

import tangelo
import tangelo.util
import tangelo.websocket

cpserver = None

class Tangelo(object):
    # An HTML parser for use in the error_page handler.
    html = HTMLParser.HTMLParser()

    def __init__(self, vtkweb_ports=None, here=None):
        # A dict containing information about imported modules.
        self.modules = {}

        # A dict containing currently running streaming data sources.
        self.streams = {}

        # The directory containing the tangelo start script.
        self.here = here

        # The vtkpython executable.
        self.vtkpython = os.environ.get("VTKPYTHON")

        # A set containing available ports for running VTK Web processes on, and
        # a dict mapping keys to such processes.
        #
        # TODO(choudhury): use a deque instead, so port numbers can be tried in
        # order in case one of them goes wrong (like there's another program
        # sitting on a port, etc.) (Be sure to count how many ports have been
        # tried, in case all of them are bad ;) ).
        self.vtkweb_ports = set(vtkweb_ports or [])
        self.vtkweb_processes = {}

        tangelo.log("port pool for vtkweb processes: %s" % (str(list(self.vtkweb_ports))))

    def cleanup(self):
        # Terminate the VTK web processes.
        for p in self.vtkweb_processes.values():
            p["process"].terminate()
            p["process"].wait()

    @staticmethod
    def error_page(status, message, traceback, version):
        message = Tangelo.html.unescape(message)
        return """<!doctype html>
<h2>%s</h2>
<p>%s
<hr>
<p><em>Powered by Tangelo</em> <img src=/img/tangelo.ico>""" % (status, message)

    def invoke_service(self, module, *pargs, **kwargs):
        # TODO(choudhury): This method should attempt to load the named module,
        # then invoke it with the given arguments.  However, if the named module
        # is "config" or something similar, the method should instead launch a
        # special "config" app, which lists the available app modules, along
        # with docstrings or similar.  It should also allow the user to
        # add/delete search paths for other modules.
        tangelo.content_type("text/plain")

        # Save the system path (be sure to *make a copy* using the list()
        # function) - it will be modified before invoking the service, and must
        # be restored afterwards.
        origpath = list(sys.path)

        # By default, the result should be a bare response that we will place an
        # error message in if something goes wrong; if nothing goes wrong this
        # will be replaced with some other object.
        result = tangelo.empty_response()

        # Store the modpath in the thread-local storage (tangelo.paths() makes
        # use of this per-thread data, so this is the way to get the data across
        # the "module boundary" properly).
        modpath = os.path.dirname(module)
        cherrypy.thread_data.modulepath = modpath
        cherrypy.thread_data.modulename = module

        # Extend the system path with the module's home path.
        sys.path.insert(0, modpath)

        # Import the module if not already imported previously (or if the module
        # to import, or its configuration file, has been updated since the last
        # import).
        try:
            stamp = self.modules.get(module)
            mtime = os.path.getmtime(module)

            config_file = module[:-2] + "json"
            config_mtime = None
            if os.path.exists(config_file):
                config_mtime = os.path.getmtime(config_file)

            if stamp is None or mtime > stamp["mtime"] or (config_mtime is not None and config_mtime > stamp["mtime"]):
                if stamp is None:
                    tangelo.log("loading new module: " + module)
                else:
                    tangelo.log("reloading module: " + module)

                # Load any configuration the module might carry with it.
                if config_mtime is not None:
                    try:
                        with open(config_file) as f:
                            config = json.loads(json_minify(f.read()))
                            if type(config) != dict:
                                msg = "Service module configuration file does not contain a key-value store (i.e., a JSON Object)"
                                tangelo.log(msg)
                                raise TypeError(msg)
                    except IOError:
                        tangelo.log("Could not open config file %s" % (config_file))
                        raise
                    except ValueError as e:
                        tangelo.log("Error reading config file %s: %s" % (config_file, e))
                        raise
                else:
                    config = {}

                cherrypy.config["module-config"][module] = config

                # Remove .py to get the module name
                name = module[:-3]

                # Load the module.
                service = imp.load_source(name, module)
                self.modules[module] = { "module": service,
                                         "mtime": max(mtime, config_mtime) }
            else:
                service = stamp["module"]
        except:
            bt = traceback.format_exc()

            tangelo.log("Error importing module %s" % (tangelo.request_path()), "SERVICE")
            tangelo.log(bt, "SERVICE")

            result = tangelo.HTTPStatusCode("501 Error in Python Service", "There was an error while trying to import module %s:<br><pre>%s</pre>" % (tangelo.request_path(), bt))
        else:
            # Try to run the service - either it's in a function called "run()",
            # or else it's in a REST API consisting of at least one of "get()",
            # "put()", "post()", or "delete()".
            #
            # Collect the result in a variable - depending on its type, it will be
            # transformed in some way below (by default, to JSON, but may also raise
            # a cherrypy exception, log itself in a streaming table, etc.).
            #
            try:
                if 'run' in dir(service):
                    # Call the module's run() method, passing it the positional and
                    # keyword args that came into this method.
                    result = service.run(*pargs, **kwargs)
                else:
                    # Reaching here means it's a REST API.  Check for the
                    # requested method, ensure that it was marked as being part
                    # of the API, and call it; or give a 405 error.
                    method = cherrypy.request.method
                    restfunc = service.__dict__[method.lower()]
                    if restfunc is not None and hasattr(restfunc, "restful") and restfunc.restful:
                        result = restfunc(*pargs, **kwargs)
                    else:
                        result = tangelo.HTTPStatusCode(405, "Method not allowed")
            except Exception as e:
                bt = traceback.format_exc()

                tangelo.log("Caught exception while executing service %s" % (tangelo.request_path()), "SERVICE")
                tangelo.log(bt, "SERVICE")

                result = tangelo.HTTPStatusCode("501 Error in Python Service", "There was an error executing service %s:<br><pre>%s</pre>" % (tangelo.request_path(), bt))

        # Restore the path to what it was originally.
        sys.path = origpath

        # Check the type of the result to decide what result to finally return:
        #
        # 1. If it is an HTTPStatusCode object, raise a cherrypy HTTPError
        # exception, which will cause the browser to do the right thing.
        #
        # 2. TODO: If it's a Python generator object, log it with the Tangelo
        # streaming API.
        #
        # 3. If it's a Python dictionary, convert it to JSON.
        #
        # 4. If it's a string, don't do anything to it.
        #
        # This allows the services to return a Python object if they wish, or to
        # perform custom serialization (such as for MongoDB results, etc.).
        if isinstance(result, tangelo.HTTPStatusCode):
            if result.msg:
                raise cherrypy.HTTPError(result.code, result.msg)
            else:
                raise cherrypy.HTTPError(result.code)
        elif "next" in dir(result):
            # Generate a key corresponding to this object, using 100 random
            # bytes from the system - ensure the random key is not already in
            # the table (even though it would be crazy to wind up with a
            # collision).
            #
            # TODO(choudhury): replace this with a call to generate_key().
            # Move the comment above into the generate_key() function.
            key = md5.md5(os.urandom(100)).hexdigest()
            while key in self.streams:
                key = md5.md5(os.urandom(100)).hexdigest()

            # Log the object in the streaming table.
            self.streams[key] = result

            # Create an object describing the logging of the generator object.
            result = tangelo.empty_response()
            result["stream_key"] = key

            # Serialize it to JSON.
            result = json.dumps(result)
        elif not isinstance(result, types.StringTypes):
            try:
                result = json.dumps(result)
            except TypeError as e:
                t = e.message.split("<service.")[1].split()[0]
                msg = "Service %s returned an object of type %s that could not be serialized to JSON" % (tangelo.request_path(), t)

                tangelo.log("Error: %s" % (msg), "SERVICE")

                raise cherrypy.HTTPError("501 Error in Python Service", msg)

        return result

    @staticmethod
    def dirlisting(dirpath, reqpath):
        if reqpath[-1] == "/":
            reqpath = reqpath[:-1]
        files = filter(lambda x: len(x) > 0 and x[0] != ".", os.listdir(dirpath))
        #filespec = ["Type", "Name", "Last modified", "Size"]
        filespec = []
        for f in files:
            p = dirpath + os.path.sep + f
            s = os.stat(p)
            mtime = datetime.datetime.fromtimestamp(s.st_mtime).strftime("%Y-%m-%d %H:%M:%S")

            if os.path.isdir(p):
                f += "/"
                t = "dir"
                s = "-"
            else:
                t = "file"
                s = s.st_size

            filespec.append([t, "<a href=\"%s/%s\">%s</a>" % (reqpath, f, f), mtime, s])

        filespec = "\n".join(map(lambda row: "<tr>" + "".join(map(lambda x: "<td>%s</td>" % x, row)) + "</tr>", filespec))

        result = """<!doctype html>
<title>Index of %s</title>
<h1>Index of %s</h1>
<table>
<tr>
    <th>Type</th><th>Name</th><th>Last Modified</th><th>Size</th>
</tr>
%s
</table>
""" % (reqpath, reqpath, filespec)

        #return "<!doctype html><h1>Directory Listing</h1>This is a dummy directory listing placeholder."
        return result

    @cherrypy.expose
    def default(self, *path, **args):
        target = cherrypy.thread_data.target
        if target is not None:
            if target["type"] == "file":
                return cherrypy.lib.static.serve_file(target["path"])
            elif target["type"] == "dir":
                return Tangelo.dirlisting(target["path"], cherrypy.request.path_info)
            elif target["type"] == "service":
                return self.invoke_service(target["path"], *target["pargs"], **args)
            elif target["type"] == "404":
                raise cherrypy.lib.static.serve_file(target["path"])
            else:
                raise RuntimeError("Illegal target type '%s'" % (target["type"]))

    @cherrypy.expose
    def stream(self, key=None, action="next"):
        if action != "show":
            # Check for key parameter.
            if key is None:
                raise cherrypy.HTTPError("400 Required Query Parameter Missing", "The streaming API requires a 'key' query parameter")

            # Check that the key actually exists.
            if key not in self.streams:
                raise cherrypy.HTTPError("404 Key Not Found", "The key '%s' does not reference any existing stream" % (key))

        # Construct a container object.
        result = tangelo.empty_response()

        # Perform the requested action.
        actions = ["next", "delete", "show"]
        if action == "next":
            # Grab the stream in preparation for running it.
            stream = self.streams[key]

            # Attempt to run the stream via its next() method - if this yields a
            # result, then continue; if the next() method raises StopIteration,
            # then there are no more results to retrieve; if any other exception
            # is raised, this is treated as an error.
            try:
                result["stream_finished"] = False
                result["result"] = stream.next()
            except StopIteration:
                result["stream_finished"] = True
                del self.streams[key]
            except:
                del self.streams[key]
                raise cherrypy.HTTPError("501 Error in Python Service", "Caught exception while executing stream service keyed by %s:<br><pre>%s</pre>" % (key, traceback.format_exc()))

        elif action == "delete":
            del self.streams[key]
            result["result"] = "OK"
        elif action == "show":
            raise cherrypy.HTTPError("501 Unimplemented", "The 'show' action in the Tangelo streaming API has not yet been implemented")
        else:
            raise cherrypy.HTTPError("400 Bad Query Parameter", "The 'action' parameter must be one of: %s" % (", ".join(actions)))

        try:
            result = json.dumps(result)
        except TypeError:
            raise cherrypy.HTTPError("501 Bad Response from Python Service", "The stream keyed by %s returned a non JSON-seriazable result: %s" % (key, result["result"]))

        return result

    @cherrypy.expose
    def vtkweb(self, *pargs, **kwargs):
        # TODO(choudhury): Implement a PUT method that expands the pool of
        # usable port numbers.

        # Be sure there was a vtkpython executable specified via the
        # environment, and a value provided for self.here.
        if self.vtkpython is None:
            return json.dumps({ "status": "failed",
                                "reason": "no VTKPYTHON in environment" })
        if self.here is None:
            return json.dumps({ "status": "failed",
                                "reason": "no 'here' argument provided to Tangelo object constructor" })

        # Get keyword arguments.
        progargs = kwargs.get("progargs", "")
        timeout = kwargs.get("timeout", 0)

        # Convert the positional args to a list.
        pargs = list(pargs)

        # Dispatch a RESTful action.
        method = cherrypy.request.method
        if method == "GET":
            # If there is no key argument, send back a list of all the keys.
            if len(pargs) == 0:
                response = self.vtkweb_processes.keys()
            else:
                # Extract the key argument.
                key = pargs[0]

                # Check for the key in the process table.
                if key not in self.vtkweb_processes:
                    return json.dumps({"status": "failed", "reason": "Requested key not in process table"})

                # Retrieve the entry.
                rec = self.vtkweb_processes[key]
                response = { "status": "complete",
                             "process": "running",
                             "port": rec["port"],
                             "stdout": rec["stdout"].readlines(),
                             "stderr": rec["stderr"].readlines() }

                returncode = rec["process"].poll()
                if returncode is not None:
                    # Since the process has ended, reclaim its resources and delete
                    # the process object.
                    self.vtkweb_ports.add(rec["port"])
                    del self.vtkweb_processes[key]

                    # Fill out the report response.
                    response["process"] = "terminated"
                    response["returncode"] = returncode

            # Make a report to the user.
            return json.dumps(response)
        elif method == "POST":
            if len(pargs) == 0:
                return json.dumps({"status": "incomplete", "reason": "missing path to vtkweb script"})

            # Form the web path from the pargs components
            progpath = os.path.sep.join(pargs)

            # Verify that all required arguments are present.
            if len(pargs) == 0:
                return json.dumps({"status": "incomplete", "reason": "Missing program URL"})

            # Check the user arguments.
            userargs = progargs.split()
            if "--port" in userargs:
                return json.dumps({"status": "incomplete", "reason": "You may not specify --port in this interface"})

            # Verify that the program path is legal.
            if not tangelo.legal_path(progpath)[0]:
                return json.dumps({"status": "incomplete", "reason": "Illegal program URL"})

            # Obtain a filesystem path to the requested program.
            progfile = tangelo.abspath(progpath)

            # Check for an available port.
            if len(self.vtkweb_ports) == 0:
                # Try to reclaim any dead processes.
                #
                # Collect a list of dead processes by key while reclaiming their
                # port numbers.
                good = False
                delete = []
                tangelo.log(str(self.vtkweb_processes))
                for k, v in self.vtkweb_processes.iteritems():
                    if v["process"].poll() is not None:
                        good = True
                        self.vtkweb_ports.add(v["port"])
                        delete.append(k)

                # Delete the dead entries from the process table.
                for d in delete:
                    del self.vtkweb_processes[d]

                # If no process was dead, tell the user the bad news.
                if not good:
                    return json.dumps({"status": "failed", "reason": "no available ports"})

            # Get a port and generate a unique key.
            port = self.vtkweb_ports.pop()
            key = tangelo.util.generate_key(self.vtkweb_processes.keys())

            def launch_failure(msg):
                # On launch failure, replace the port number in the pool, and
                # report the failure to the user.
                self.vtkweb_ports.add(port)
                return json.dumps({"status": "failed", "reason": msg})

            # Launch the requested process.
            try:
                cmdline = [self.vtkpython, self.here + "/vtkweb-launcher.py", progfile, "--port", str(port)] + userargs
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
            self.vtkweb_processes[key] = { "port": port,
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
            if key not in self.vtkweb_processes:
                tangelo.log("key not found")
                return json.dumps({"status": "failed", "reason": "no such key in process table"})

            # Terminate the process.
            tangelo.log("terminating process")
            proc = self.vtkweb_processes[key]
            proc["process"].terminate()
            proc["process"].wait()
            tangelo.log("terminated")

            # Reclaim the port number being used by the process, and remove it
            # from the table.
            tangelo.log("reclaiming port %d" % (proc["port"]))
            self.vtkweb_ports.add(proc["port"])
            del self.vtkweb_processes[key]

            return json.dumps({"status": "complete"})
        else:
            raise cherrypy.HTTPError(405, "Method not allowed")
