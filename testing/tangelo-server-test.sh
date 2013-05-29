#!/bin/sh

# Start the server, and report an error on failure.
@CMAKE_BINARY_DIR@/@DEPLOY_DIR@/tangelo restart
if [ "$?" != 0 ]; then
    echo "Couldn't start server"
    exit 1
fi

# The command to run, and the expected output should appear in single (i.e.,
# quoted) arguments.
cmd=$1
expected=$2

# Run the command and capture the output.
result=`eval ${cmd}`

# Print a report of what's going on.
echo "Command string: ${cmd}"
echo "Expected result: ${expected}"
echo "Actual result: ${result}"

# Decide whether the strings match, and report this as the return value.
if [ "${result}" == "${expected}" ]; then
    echo "Strings match!"
    retval=0
else
    retval=1
    echo "Strings do not match"
fi

exit ${retval}
