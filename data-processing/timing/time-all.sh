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
actions="$*"

echo -n "Timing mongoimport..." >/dev/stderr
mongoimport=`./time-mongoimport.sh ${file}`
echo "done (${mongoimport} seconds)" >/dev/stderr

echo -n "Timing csv2mongo (no processing)..." >/dev/stderr
csv2mongobare=`./time-csv2mongo.sh ${file}`
echo "done (${csv2mongobare} seconds)" >/dev/stderr

echo -n "Timing csv2mongo (w/processing)..." >/dev/stderr
csv2mongoprocess=`./time-csv2mongo.sh ${file} ${actions}`
echo "done (${csv2mongoprocess} seconds)" >/dev/stderr

echo "mongoimport,csv2mongo,csv2mongo (w/processing)"
echo "${mongoimport},${csv2mongobare},${csv2mongoprocess}"
