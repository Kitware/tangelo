import cherrypy
import errno
import imp
import json
import os
import os.path
import md5
import socket
import threading
import traceback
import Queue

import tangelo
from tangelo.minify_json import json_minify


def load_service_config(path):
    with open(path) as f:
        config = json.loads(json_minify(f.read()))
        if type(config) != dict:
            raise TypeError("Service module configuration file does not contain a key-value store (i.e., a JSON Object)")

    return config


def get_free_port():
    # Bind a socket to port 0 (which directs the OS to find an unused port).
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(("", 0))

    # Get the port number, and release the resources used in binding the port
    # (no need to call shutdown() because we never called listen() or accept()
    # on it).
    port = s.getsockname()[1]
    s.close()

    return port


def expandpath(spec):
    return (os.path.expanduser if spec[0] == "~" else os.path.abspath)(spec)


def live_pid(pid):
    try:
        os.kill(pid, 0)
    except OSError as e:
        # ESRCH means os.kill() couldn't find a valid pid to send the signal
        # to, which means it's not a live PID.  The other possible error value
        # is EPERM, meaning that the pid is live but the user doesn't have the
        # permissions to send it a signal.
        return e.errno != errno.ESRCH
    else:
        return True


def read_pid(pidfile):
    # Open the file and convert the contents to an integer - if this fails for
    # any reason, whatever exception is raised will propagate up to the caller.
    with open(pidfile) as f:
        pid = int(f.read())

    return pid


def generate_key(taken, randbytes=128):
    key = md5.md5(os.urandom(randbytes)).hexdigest()
    while key in taken:
        key = md5.md5(os.urandom(randbytes)).hexdigest()

    return key


class NonBlockingReader(threading.Thread):
    def __init__(self, stream):
        threading.Thread.__init__(self)
        self.daemon = True

        self.stream = stream
        self.queue = Queue.Queue()
        self.pushbuf = []

        self.start()

    def run(self):
        for line in iter(self.stream.readline, ""):
            self.queue.put(line)
        self.stream.close()

    def readline(self):
        if len(self.pushbuf) > 0:
            return self.pushbuf.pop()
        else:
            try:
                line = self.queue.get_nowait()
            except Queue.Empty:
                line = None

            return line

    def readlines(self):
        lines = []
        done = False
        while not done:
            line = self.readline()
            if line is not None:
                lines.append(line)
            else:
                done = True

        return lines

    def pushline(self, line):
        if len(line) == 0 or line[-1] != "\n":
            line.append("\n")

        self.pushbuf.append(line)

    def pushlines(self, lines):
        for line in lines:
            self.pushline(line)


class ModuleCache(object):
    def __init__(self, config=True, http_error=True):
        self.config = config
        self.http_error = http_error
        self.modules = {}

    def get(self, module):
        # Import the module if not already imported previously (or if the module
        # to import, or its configuration file, has been updated since the last
        # import).
        try:
            stamp = self.modules.get(module)
            mtime = os.path.getmtime(module)

            config_file = module[:-2] + "json"
            config_mtime = None

            if self.config:
                if os.path.exists(config_file):
                    config_mtime = os.path.getmtime(config_file)

            if (stamp is None or
                    mtime > stamp["mtime"] or
                    (config_mtime is not None and
                     config_mtime > stamp["mtime"])):

                # Load any configuration the module might carry with it.
                if config_mtime is not None:
                    try:
                        config = load_service_config(config_file)
                    except TypeError as e:
                        tangelo.log("TANGELO", "Bad configuration in file %s: %s" % (config_file, e))
                        raise
                    except IOError:
                        tangelo.log("TANGELO", "Could not open config file %s" % (config_file))
                        raise
                    except ValueError as e:
                        tangelo.log("TANGELO", "Error reading config file %s: %s" %
                                    (config_file, e))
                        raise
                else:
                    config = {}

                if self.config:
                    cherrypy.config["module-config"][module] = config
                    cherrypy.config["persistent-store"][module] = {}

                # Remove .py to get the module name
                name = module[:-3]

                # Load the module.
                service = imp.load_source(name, module)
                self.modules[module] = {"module": service,
                                        "mtime": max(mtime, config_mtime)}
            else:
                service = stamp["module"]

            return service
        except:
            bt = traceback.format_exc()

            tangelo.log("TANGELO", "Error importing module %s" % (tangelo.request_path()))
            tangelo.log("TANGELO", bt)

            if self.http_error:
                raise tangelo.HTTPStatusCode("501 Error in Python Service",
                                             tangelo.server.Tangelo.literal + "There was an error while " +
                                             "trying to import module " +
                                             "%s:<br><pre>%s</pre>" %
                                             (tangelo.request_path(), bt))
