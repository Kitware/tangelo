import datetime
import platform
import subprocess
import time

host = "localhost"
port = "50047"

process = None


def windows():
    return platform.platform().split("-")[0] == "Windows"

def url(*path, **query):
    return "http://%s:%s/%s?%s" % (host, port, "/".join(path), "&".join(["%s=%s" % (key, value) for key, value in query.iteritems()]))

def plugin_url(*path, **query):
    return url(*(["plugin"] + list(path)), **query)

def run_tangelo(*args, **kwargs):
    timeout = kwargs.get("timeout", 5)
    tangelo = ["venv/Scripts/python", "venv/Scripts/tangelo"] if windows() else ["venv/bin/tangelo"]

    # Start Tangelo with the specified arguments, and immediately poll the
    # process to bootstrap its returncode state.
    proc = subprocess.Popen(tangelo + list(args), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    proc.poll()

    # Run in a loop until the timeout expires or the process ends.
    now = start = datetime.datetime.now()
    while (now - start).total_seconds() < timeout and proc.returncode is None:
        time.sleep(0.5)
        proc.poll()
        now = datetime.datetime.now()

    return (proc.returncode, filter(None, proc.stdout.read().splitlines()), filter(None, proc.stderr.read().splitlines()))

def start_tangelo():
    global process

    if process is not None:
        raise RuntimeError("start_tangelo() called twice without a stop_tangelo() in between")

    if windows():
        coverage_args = []
        tangelo = ["venv/Scripts/python", "venv/Scripts/tangelo"]
    else:
        source_dirs = ["bokeh/python",
                       "config/web",
                       "girder",
                       "impala/web",
                       "mongo/web",
                       "stream/web",
                       "tangelo/web",
                       "vtkweb",
                       "vtkweb/web"]
        source_dirs = ",".join(map(lambda p: "venv/share/tangelo/plugin/%s" % (p), source_dirs))

        coverage_args = ["venv/bin/coverage", "run", "-p", "--source", "venv/lib/python2.7/site-packages/tangelo,%s" % (source_dirs)]
        tangelo = ["venv/bin/tangelo"]

    process = subprocess.Popen(coverage_args + tangelo + ["--host", host,
                                                          "--port", port,
                                                          "--root", "tests/web",
                                                          "--plugin-config", "venv/share/tangelo/plugin/plugin.conf"],
                               stderr=subprocess.PIPE)

    buf = []
    while True:
        line = process.stderr.readline()
        buf.append(line)

        if line.rstrip().endswith("ENGINE Bus STARTED"):
            return 0
        elif line.rstrip().endswith("ENGINE Bus EXITED") or process.poll() is not None:
            process = None
            raise RuntimeError("Could not start Tangelo:\n%s" % ("".join(buf)))

def stop_tangelo():
    global process

    if process is None:
        raise RuntimeError("stop_tangelo() called without corresponding start_tangelo()")

    # Send a terminate signal to the running Tangelo.
    process.terminate()

    # Set a 10 second timeout to wait for Tangelo to end on its own.
    start = now = time.time()
    while now - start < 10:
        retcode = process.poll()
        if retcode is not None:
            process = None
            return 0
        time.sleep(0.5)

    # If Tangelo is still not dead, kill it forcibly.
    if retcode is None:
        process.kill()

    # Reset the global variable for the next call to start_tangelo().
    process = None
    return 0
