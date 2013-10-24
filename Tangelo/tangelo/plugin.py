import errno
import os
import os.path
import re
import stat
import string

import tangelo

from   cherrypy.process.plugins import SimplePlugin

class StatusFile(SimplePlugin):
    fields = ["cfg_file", "logfile", "pidfile", "webroot", "hostname", "port"]
    tmpdir = "/var/tmp"

    def __init__(self, bus, cfg_file=None, logfile=None, pidfile=None, webroot=None, hostname=None, port=None):
        SimplePlugin.__init__(self, bus)
        
        self.finalized = False
        self.pid = os.getpid()
        self.filename = StatusFile.status_filename(self.pid)

        tangelo.log("here")
        self.status = {k: str(v) for k, v in zip(StatusFile.fields, map(eval, StatusFile.fields))}
        tangelo.log("there")

        for k, v in self.status.iteritems():
            if v is None:
                raise TypeError("argument '%s' cannot be None" % (k))

    def start(self):
        if self.finalized:
            self.bus.log("Status file for %d already written to %s" % (self.pid, self.filename))
            return

        with open(self.filename, "w") as f:
            for k, v in self.status.iteritems():
                print >>f, " ".join([k, v])

        self.finalized = True
    start.priority = 78

    def exit(self):
        try:
            os.remove(self.filename)
            self.bus.log("Status file removed: %s" % (self.filename))
        except (KeyboardInterrupt, SystemExit):
            raise
        except:
            pass
        
    @staticmethod
    def read_status_file(filename):
        try:
            with open(filename) as f:
                data = f.readlines()
        except IOError as e:
            if e.errno == errno.EACCES:
                raise IOError(errno.EPERM, "insufficient permissions to retrieve status for pid %d" (pid))
            else:
                raise
        else:
            try:
                status = {k: v for k, v in map(string.split, data)}
            except ValueError as e:
                if "unpack" in e.message:
                    raise ValueError("fatal error: bad formatting in status file %s" % (status_file))

        return status

    @staticmethod
    def status_filename(pid):
        return "/var/tmp/tangelo.%d" % (pid)
