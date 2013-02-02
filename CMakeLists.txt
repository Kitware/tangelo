cmake_minimum_required(VERSION 2.8)
project(XDATA-Web)

# Find JSLint.
find_program(JSLINT jslint)
if(${JSLINT} STREQUAL "JSLINT-NOTFOUND")
    message(FATAL_ERROR "Could not find JSLint.  You can install it with \"npm install -g jslint\"")
endif()

# List the JavaScript sources.
set(JSFILES
    ${CMAKE_SOURCE_DIR}/xdataweb/web/root/index.js
    ${CMAKE_SOURCE_DIR}/xdataweb/web/lib/id.js
    ${CMAKE_SOURCE_DIR}/xdataweb/web/lib/slider.js
    ${CMAKE_SOURCE_DIR}/xdataweb/web/lib/date.js
    ${CMAKE_SOURCE_DIR}/xdataweb/web/lib/barchart.js
    ${CMAKE_SOURCE_DIR}/xdataweb/web/apps/NER/NER.js
    ${CMAKE_SOURCE_DIR}/xdataweb/web/apps/stats/stats.js
    ${CMAKE_SOURCE_DIR}/xdataweb/web/apps/DataTwiddle/DataTwiddle.js
    ${CMAKE_SOURCE_DIR}/xdataweb/web/apps/VegaLab/vegalab.js
    ${CMAKE_SOURCE_DIR}/xdataweb/web/apps/ssci/ssci.js
    ${CMAKE_SOURCE_DIR}/xdataweb/web/apps/flickr/flickr.js
    ${CMAKE_SOURCE_DIR}/xdataweb/web/apps/mapping/mapping.js
    ${CMAKE_SOURCE_DIR}/xdataweb/web/config/flickr-config.js
    ${CMAKE_SOURCE_DIR}/xdataweb/web/config/NER-config.js
)

# Testing
include(CTest)
enable_testing()

# JSLint tests.
foreach(f ${JSFILES})
    add_test(jslint-${f} ${JSLINT} ${f})
endforeach()
