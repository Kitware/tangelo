#!/bin/sh

# This script provides a timing test of the mongoimport program when uploading a
# dataset to a Mongo server.  This is a base timing for such uploads, as it
# ships with MongoDB by default.

file="$1"
if [ -z "${file}" ]; then
    echo "missing datafile name" >/dev/stderr
    exit 1
fi

timer="/usr/bin/time -f %e"
target="mongoimport -h mongo -d xdata -c upload-timing-test --drop --headerline --type csv --file ${file}"

# Perform the timing run.
${timer} -- ${target} 2>&1 >/dev/null
