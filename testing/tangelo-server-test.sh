#!/bin/sh

# Start the server, and report an error on failure.
@CMAKE_BINARY_DIR@/@DEPLOY_DIR@/tangelo restart
if [ "$?" != 0 ]; then
    echo "Couldn't start server"
    exit 1
fi

cmd=$1
expected=$2

result=`${cmd}`

echo "Command string: ${cmd}"
echo "Expected result: ${expected}"
echo "Actual result: ${result}"

if [ "${result}" == "${expected}" ]; then
    echo "Strings match!"
    retval=0
else
    retval=1
    echo "Strings do not match"
fi

exit ${retval}
