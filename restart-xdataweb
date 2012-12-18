#!/usr/bin/env python

import sys
import os.path
import subprocess

path = os.path.dirname(os.path.abspath(sys.argv[0]))
stop = path + "/stop-xdataweb.py"
start = path + "/start-xdataweb.py"
subprocess.call([stop])
subprocess.call([start])
