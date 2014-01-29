import errno
import os
import os.path
import md5
import socket
import threading
import Queue

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
        # ESRCH means os.kill() couldn't find a valid pid to send the signal to,
        # which means it's not a live PID.  The other possible error value is
        # EPERM, meaning that the pid is live but the user doesn't have the
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
