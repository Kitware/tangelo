#!/bin/sh

echo "$1" | while IFS=":" read hostname port extra
do
    if [ -z $hostname ] || [ -z $port ] || [ ! -z  $extra ]; then
        echo Bad instantiation name \"$1\"
        exit 1
    fi

    exec /usr/bin/tangelo -c /etc/tangelo.conf --hostname $hostname --port $port
done
