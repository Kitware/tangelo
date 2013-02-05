cmake_minimum_required(VERSION 2.8)
project(XDATA-Web)

# Cache variables.
set(DEPLOY_TEST_SERVICES OFF CACHE BOOL "Deploy the \"testing\" web service modules.")
set(DEPLOY_DIR deploy CACHE PATH "Build subdirectory into which to deploy the web framework.")
set(SERVER_HOSTNAME localhost CACHE STRING "The hostname of the machine that will run the server.")
set(SERVER_PORT 8080 CACHE STRING "The port the server will run on.")
set(MINIFY ON CACHE BOOL "Minify the JavaScript files prior to concatenating.")
set(MANGLE ON CACHE BOOL "When minifying, also mangle non-public symbol names.")

# Find JSLint.
find_program(JSLINT jslint)
if(${JSLINT} STREQUAL "JSLINT-NOTFOUND")
    message(WARNING "Could not find JSLint.  You can install it with \"npm install -g jslint\"")
endif()

# Find UglifyJS.
find_program(UGLIFYJS uglifyjs)
if(${UGLIFYJS} STREQUAL "UGLIFYJS-NOTFOUND")
    message(FATAL_ERROR "Could not find UglifyJS.  You can install it with \"npm install -g uglify-js\"")
endif()

# These files should be validated with JSLint.
set(JS_LINT_FILES
    ${CMAKE_SOURCE_DIR}/xdataweb/web/root/index.js
    #${CMAKE_SOURCE_DIR}/xdataweb/web/lib/id.js
    ${CMAKE_SOURCE_DIR}/xdataweb/web/lib/slider.js
    ${CMAKE_SOURCE_DIR}/xdataweb/web/lib/date.js
    #${CMAKE_SOURCE_DIR}/xdataweb/web/lib/barchart.js
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

# These files should be uglified and concatenated.
set(JS_UGLIFY_FILES
    ${CMAKE_SOURCE_DIR}/xdataweb/web/lib/xdw.js
    #${CMAKE_SOURCE_DIR}/xdataweb/web/lib/id.js
    ${CMAKE_SOURCE_DIR}/xdataweb/web/lib/slider.js
    ${CMAKE_SOURCE_DIR}/xdataweb/web/lib/date.js
    #${CMAKE_SOURCE_DIR}/xdataweb/web/lib/barchart.js
    ${CMAKE_SOURCE_DIR}/xdataweb/web/lib/vgd3.js
    ${CMAKE_SOURCE_DIR}/xdataweb/web/lib/vg.util.js
)

# These files should be copied to the deployment directory.
set(SOURCES
    xdwctl
    xdataweb/__init__.py
    xdataweb/modules/__init__.py
    xdataweb/modules/datatwiddle.py
    xdataweb/modules/echo.py
    xdataweb/modules/mongo.py
    xdataweb/modules/NERmongo.py
    xdataweb/modules/NER.py
    xdataweb/web/apps/DataTwiddle/DataTwiddle.js
    xdataweb/web/apps/DataTwiddle/index.html
    xdataweb/web/apps/flickr/flickr.js
    xdataweb/web/apps/flickr/index.html
    xdataweb/web/apps/mapping/cities.json
    xdataweb/web/apps/mapping/dots.json
    xdataweb/web/apps/mapping/index.html
    xdataweb/web/apps/mapping/map.json
    xdataweb/web/apps/mapping/mapping.css
    xdataweb/web/apps/mapping/mapping.js
    xdataweb/web/apps/mapping/vgd3.js
    xdataweb/web/apps/mapping/world-countries.json
    xdataweb/web/apps/NER/index.html
    xdataweb/web/apps/NER/letters.csv
    xdataweb/web/apps/NER/NER.css
    xdataweb/web/apps/NER/NER.js
    xdataweb/web/apps/ssci/index.html
    xdataweb/web/apps/ssci/ssci.js
    xdataweb/web/apps/ssci/ssci.json
    xdataweb/web/apps/stats/index.html
    xdataweb/web/apps/stats/stats.js
    xdataweb/web/apps/VegaLab/data/7zip.png
    xdataweb/web/apps/VegaLab/data/cities.json
    xdataweb/web/apps/VegaLab/data/ffox.png
    xdataweb/web/apps/VegaLab/data/gimp.png
    xdataweb/web/apps/VegaLab/data/letters.json
    xdataweb/web/apps/VegaLab/data/world-countries.json
    xdataweb/web/apps/VegaLab/examples/histogram/histogram-data.js
    xdataweb/web/apps/VegaLab/examples/histogram/histogram.js
    xdataweb/web/apps/VegaLab/examples/histogram/histogram.json
    xdataweb/web/apps/VegaLab/examples/histogram-json/histogram-json-data.json
    xdataweb/web/apps/VegaLab/examples/histogram-json/histogram-json.js
    xdataweb/web/apps/VegaLab/examples/histogram-json/histogram-json.json
    xdataweb/web/apps/VegaLab/examples/ordinal-bars/ordinal-bars.json
    xdataweb/web/apps/VegaLab/examples/vega-arc/vega-arc-data.js
    xdataweb/web/apps/VegaLab/examples/vega-arc/vega-arc.json
    xdataweb/web/apps/VegaLab/examples/vega-bars/vega-bars-data.json
    xdataweb/web/apps/VegaLab/examples/vega-bars/vega-bars.json
    xdataweb/web/apps/VegaLab/examples/vega-data.js
    xdataweb/web/apps/VegaLab/examples/vega-image/vega-image.json
    xdataweb/web/apps/VegaLab/examples/vega-line/vega-line-data.js
    xdataweb/web/apps/VegaLab/examples/vega-line/vega-line.json
    xdataweb/web/apps/VegaLab/examples/vega-map/vega-map.json
    xdataweb/web/apps/VegaLab/examples/vega-stack_area/vega-stack_area-data.js
    xdataweb/web/apps/VegaLab/examples/vega-stack_area/vega-stack_area.json
    xdataweb/web/apps/VegaLab/examples/vega-stack_bars/vega-stack_bars-data.js
    xdataweb/web/apps/VegaLab/examples/vega-stack_bars/vega-stack_bars.json
    xdataweb/web/apps/VegaLab/examples/vega-symbol/vega-symbol-data.js
    xdataweb/web/apps/VegaLab/examples/vega-symbol/vega-symbol.json
    xdataweb/web/apps/VegaLab/examples/vega-treemap/vega-treemap-data.js
    xdataweb/web/apps/VegaLab/examples/vega-treemap/vega-treemap.json
    xdataweb/web/apps/VegaLab/index.html
    xdataweb/web/apps/VegaLab/lib/projection.js
    xdataweb/web/apps/VegaLab/vegalab.css
    xdataweb/web/apps/VegaLab/vegalab.js
    xdataweb/web/config/flickr-config.js
    xdataweb/web/config/flickr.html
    xdataweb/web/config/NER-config.js
    xdataweb/web/config/NER.html
    xdataweb/web/config/notfound.html
    #xdataweb/web/lib/vgd3.js
    xdataweb/web/lib/vgd3-template.js.txt
    #xdataweb/web/lib/vg.util.js
    xdataweb/web/root/apps.json
    xdataweb/web/root/bootstrap.css
    xdataweb/web/root/bootstrap-xdata.css
    xdataweb/web/root/bootswatch/bootstrap-readable.css
    xdataweb/web/root/index.html
    xdataweb/web/root/index.js
    xdataweb/web/root/xdataweb.css
)

if(DEPLOY_TEST_SERVICES)
    list(APPEND SOURCES
        xdataweb/modules/broken.py
        xdataweb/modules/exceptional.py
        xdataweb/modules/testapp.py)
endif()

# Configure the server config file.
configure_file(
    server.conf.in
    ${CMAKE_BINARY_DIR}/${DEPLOY_DIR}/server.conf)

# Copy the files to the deployment directory.
set(ALL_TARGETS)
foreach(m ${SOURCES})
    set(outfile ${DEPLOY_DIR}/${m})
    add_custom_command(
        OUTPUT ${outfile}
        COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_SOURCE_DIR}/${m} ${CMAKE_BINARY_DIR}/${outfile}
        DEPENDS ${m}
    )
    list(APPEND ALL_TARGETS ${outfile})
endforeach()

# Uglify and concatenate the library js files.
if(NOT ${MINIFY})
    set(MINIFY_FLAG "-b")
endif()

if(${MINIFY} AND ${MANGLE})
    set(MANGLE_FLAG "-m")
endif()

set(MIN_JS_FILE ${CMAKE_BINARY_DIR}/${DEPLOY_DIR}/xdataweb/web/lib/xdataweb.min.js)

add_custom_command(
    OUTPUT ${MIN_JS_FILE}
    COMMAND ${UGLIFYJS} -o ${MIN_JS_FILE} ${JS_UGLIFY_FILES} ${MINIFY_FLAG} ${MANGLE_FLAG}
    DEPENDS ${JS_UGLIFY_FILES}
)

# The top-level target.
add_custom_target(
    deploy
    ALL
    DEPENDS ${ALL_TARGETS} ${MIN_JS_FILE}
)

# Testing
include(CTest)
enable_testing()

# JSLint tests.
foreach(f ${JS_LINT_FILES})
    add_test(jslint-${f} ${JSLINT} ${f})
endforeach()
