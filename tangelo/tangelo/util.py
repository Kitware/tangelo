import cherrypy
import errno
import imp
import os
import os.path
import platform
import md5
import random
import socket
import string
import threading
import traceback
import Queue
import yaml

import tangelo


def windows():
    return platform.platform().split("-")[0] == "Windows"


def yaml_safe_load(filename, type=None):
    if os.path.exists(filename) or not filename.startswith("{"):
        with open(filename) as f:
            try:
                data = yaml.safe_load(f.read())
            except yaml.YAMLError as e:
                raise ValueError(e)
    else:
        try:
            data = yaml.safe_load(filename)
        except yaml.YAMLError as e:
            raise ValueError(e)

    if data is None:
        data = type()

    if type is not None and not isinstance(data, type):
        raise TypeError(type.__name__)

    return data


def traceback_report(**props):
    props["traceback"] = traceback.format_exc().split("\n")
    return props


def log_traceback(tag, code, *msgs):
    if not msgs:
        raise TypeError("log_traceback() takes at least 3 arguments (2 given)")

    tangelo.log_error(tag, "Error code: %s" % (code))
    for msg in msgs[:-1]:
        tangelo.log_error(tag, msg)
    tangelo.log_error(tag, "%s:\n%s" % (msgs[-1], traceback.format_exc()))


def generate_error_code():
    return "".join(random.sample(string.ascii_uppercase, 6))


def error_report(code):
    return {"message": "Error code: %s (give this code to your system administrator for more information)" % (code)}


def set_server_setting(key, value):
    cherrypy.config.update({key: value})


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


def module_cache_get(cache, module):
    """
    Import a module with an optional yaml config file, but only if we haven't
    imported it already.

    :param cache: object which holds information on which modules and config
                  files have been loaded and whether config files should be
                  loaded.
    :param module: the path of the module to load.
    :returns: the loaded module.
    """
    if getattr(cache, "config", False):
        config_file = module[:-2] + "yaml"
        if config_file not in cache.config_files and os.path.exists(config_file):
            try:
                config = yaml_safe_load(config_file, type=dict)
            except TypeError as e:
                tangelo.log_warning("TANGELO", "Bad configuration in file %s: %s" % (config_file, e))
                raise
            except IOError:
                tangelo.log_warning("TANGELO", "Could not open config file %s" % (config_file))
                raise
            except ValueError as e:
                tangelo.log_warning("TANGELO", "Error reading config file %s: %s" % (config_file, e))
                raise
            cache.config_files[config_file] = True
        else:
            config = {}
        cherrypy.config["module-config"][module] = config
        cherrypy.config["module-store"].setdefault(module, {})
    # If two threads are importing the same module nearly concurrently, we
    # could load it twice unless we use the import lock.
    imp.acquire_lock()
    try:
        if module not in cache.modules:
            name = module[:-3]

            # load the module.
            service = imp.load_source(name, module)
            cache.modules[module] = service
        else:
            service = cache.modules[module]
    finally:
        imp.release_lock()
    return service


class ModuleCache(object):
    def __init__(self, config=True):
        self.config = config
        self.modules = {}
        self.config_files = {}

    def get(self, module):
        return module_cache_get(self, module)
