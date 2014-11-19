import subprocess
import sys
import time

host = "localhost"
port = "50047"

process = None


def url(*path, **query):
    return "http://%s:%s/%s?%s" % (host, port, "/".join(path), "&".join(["%s=%s" % (key, value) for key, value in query.iteritems()]))

def plugin_url(*path, **query):
    return url(*(["plugin"] + list(path)), **query)

def start_tangelo():
    global process

    if process is not None:
        raise RuntimeError("start_tangelo() called twice without a stop_tangelo() in between")

    process = subprocess.Popen(["venv/bin/coverage", "run", "-p", "--source", "venv/lib/python2.7/site-packages/tangelo,tangelo/plugins", "--omit", "*minify_json*",
                                "venv/bin/tangelo",
                                "--host", host,
                                "--port", port,
                                "--root", "tests/www",
                                "--plugin-config", "plugin.conf"],
                               stderr=subprocess.PIPE)

    buf = []
    while True:
        line = process.stderr.readline()
        buf.append(line)

        if line.endswith("ENGINE Bus STARTED\n"):
            return 0
        elif line.endswith("ENGINE Bus EXITED\n") or process.poll() is not None:
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
