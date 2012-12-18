#!/usr/bin/env python

import sys
import os.path
import subprocess

# Choose cherryd2 or cherryd executable
cherry = "cherryd2"
try:
    subprocess.check_output(["which", cherry])
except subprocess.CalledProcessError:
    cherry = "cherryd"

path = os.path.dirname(os.path.abspath(sys.argv[0]))
pidfile = path + "/xdataweb.pid"
if os.path.exists(pidfile):
    print("error: xdataweb already seems to be running", file=sys.stderr)
    sys.exit(1)

os.chdir(path)
subprocess.call([cherry,
    "-d",
    "-i", "xdataweb",
    "-c", "server.conf",
    "-p", pidfile,
    "-P", path + "/xdataweb"])
