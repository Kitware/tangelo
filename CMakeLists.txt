cmake_minimum_required(VERSION 2.8)
project(XDATA-Web)

# Find JSLint.
find_program(JSLINT jslint)
if(${JSLINT} STREQUAL "JSLINT-NOTFOUND")
    message(FATAL_ERROR "Could not find JSLint.  You can install it with \"npm install -g jslint\"")
endif()

# Glob the JavaScript sources.
file(GLOB_RECURSE JSFILES ${CMAKE_SOURCE_DIR}/xdataweb/*.js)

include(CTest)

enable_testing()
add_test(jslint ${JSLINT} ${JSFILES})
