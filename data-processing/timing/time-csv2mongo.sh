#!/bin/sh

# This script provides a timing test of the csv2mongo.py script, when it
# performs no data conversion as it works.  It is therefore meant to be compared
# directly to the results of time-mongoimport.sh.

file="$1"
if [ -z "${file}" ]; then
    echo "missing datafile name" >/dev/stderr
    exit 1
fi

bundle="$2"
if [ -z "${bundle}" ]; then
    echo "missing bundle parameter" >/dev/stderr
    exit 1
fi

shift
shift
actions="$*"

timer="/usr/bin/time -f %e"
target="python2 ../csv2mongo.py --host mongo -d xdata -c upload-timing-test --drop -i ${file} -b ${bundle} ${actions}"

# Perform the timing run.
${timer} -- ${target} 2>&1 >/dev/null
