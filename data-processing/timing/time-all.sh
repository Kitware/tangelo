#!/bin/sh

# Example usage (please note the escaped quotation marks): './time-all.sh
# ../Flickr_indiv_Paris.clean.txt -a latitude float -a longitude float -a date
# date --date-format \"%Y-%m-%d %H:%M:%S\"'

file="$1"
if [ -z "${file}" ]; then
    echo "missing filename" >/dev/stderr
    exit 1
fi

shift
actions=$*

# Perform timing runs.
echo -n "Timing mongoimport..." >/dev/stderr
mongoimport=`./time-mongoimport.sh ${file}`
echo "done (${mongoimport} seconds)" >/dev/stderr

echo -n "Timing csv2mongo (no processing)..." >/dev/stderr
csv2mongobare=`./time-csv2mongo.sh ${file} 1`
echo "done (${csv2mongobare} seconds)" >/dev/stderr

echo -n "Timing csv2mongo (w/processing)..." >/dev/stderr
csv2mongoprocess=`./time-csv2mongo.sh ${file} 1 ${actions}`
echo "done (${csv2mongoprocess} seconds)" >/dev/stderr

echo -n "Timing csv2mongo (no processing, bundles of 10000)..." >/dev/stderr
csv2mongobare10000=`./time-csv2mongo.sh ${file} 10000`
echo "done (${csv2mongobare10000} seconds)" >/dev/stderr

echo -n "Timing csv2mongo (w/processing, bundles of 10000)..." >/dev/stderr
csv2mongoprocess10000=`./time-csv2mongo.sh ${file} 10000 ${actions}`
echo "done (${csv2mongoprocess10000} seconds)" >/dev/stderr

echo -n "Timing csv2mongo (no processing, bundles of 50000)..." >/dev/stderr
csv2mongobare50000=`./time-csv2mongo.sh ${file} 50000`
echo "done (${csv2mongobare50000} seconds)" >/dev/stderr

echo -n "Timing csv2mongo (w/processing, bundles of 50000)..." >/dev/stderr
csv2mongoprocess50000=`./time-csv2mongo.sh ${file} 50000 ${actions}`
echo "done (${csv2mongoprocess50000} seconds)" >/dev/stderr

# Report the results.
echo "mongoimport,csv2mongo,csv2mongo (w/processing),csv2mongo (10000-bundles),csv2mongo (w/processing,10000-bundles),csv2mongo (50000-bundles),csv2mongo (w/processing,50000-bundles)"
echo "${mongoimport},${csv2mongobare},${csv2mongoprocess},${csv2mongobare10000},${csv2mongoprocess10000},${csv2mongobare50000},${csv2mongoprocess50000}"
