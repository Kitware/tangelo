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
    ${CMAKE_SOURCE_DIR}/web/root/index.js
    #${CMAKE_SOURCE_DIR}/web/lib/id.js
    ${CMAKE_SOURCE_DIR}/web/lib/slider.js
    ${CMAKE_SOURCE_DIR}/web/lib/date.js
    #${CMAKE_SOURCE_DIR}/web/lib/barchart.js
    ${CMAKE_SOURCE_DIR}/web/apps/NER/NER.js
    ${CMAKE_SOURCE_DIR}/web/apps/stats/stats.js
    ${CMAKE_SOURCE_DIR}/web/apps/DataTwiddle/DataTwiddle.js
    ${CMAKE_SOURCE_DIR}/web/apps/VegaLab/vegalab.js
    ${CMAKE_SOURCE_DIR}/web/apps/ssci/ssci.js
    ${CMAKE_SOURCE_DIR}/web/apps/flickr/flickr.js
    ${CMAKE_SOURCE_DIR}/web/apps/mapping/mapping.js
    ${CMAKE_SOURCE_DIR}/web/config/flickr-config.js
    ${CMAKE_SOURCE_DIR}/web/config/NER-config.js
)

# These files should be uglified and concatenated.
set(JS_UGLIFY_FILES
    ${CMAKE_SOURCE_DIR}/web/lib/xdw.js
    #${CMAKE_SOURCE_DIR}/web/lib/id.js
    ${CMAKE_SOURCE_DIR}/web/lib/slider.js
    ${CMAKE_SOURCE_DIR}/web/lib/date.js
    #${CMAKE_SOURCE_DIR}/web/lib/barchart.js
    ${CMAKE_SOURCE_DIR}/web/lib/vgd3.js
    ${CMAKE_SOURCE_DIR}/web/lib/vg.util.js
)

# These files should be copied to the deployment directory.
set(SOURCES
    xdwctl
    xdataweb.py
    modules/__init__.py
    modules/datatwiddle.py
    modules/echo.py
    modules/mongo.py
    modules/NERmongo.py
    modules/NER.py
    modules/phylomongo.py
    web/apps/DataTwiddle/DataTwiddle.js
    web/apps/DataTwiddle/index.html
    web/apps/flickr/flickr.js
    web/apps/flickr/index.html
    web/apps/mapping/cities.json
    web/apps/mapping/dots.json
    web/apps/mapping/index.html
    web/apps/mapping/map.json
    web/apps/mapping/mapping.css
    web/apps/mapping/mapping.js
    web/apps/mapping/vgd3.js
    web/apps/mapping/world-countries.json
    web/apps/NER/index.html
    web/apps/NER/letters.csv
    web/apps/NER/NER.css
    web/apps/NER/NER.js
    web/apps/ssci/index.html
    web/apps/ssci/ssci.js
    web/apps/ssci/ssci.json
    web/apps/stats/index.html
    web/apps/stats/stats.js
    web/apps/VegaLab/data/7zip.png
    web/apps/VegaLab/data/cities.json
    web/apps/VegaLab/data/ffox.png
    web/apps/VegaLab/data/gimp.png
    web/apps/VegaLab/data/letters.json
    web/apps/VegaLab/data/world-countries.json
    web/apps/VegaLab/examples/histogram/histogram-data.js
    web/apps/VegaLab/examples/histogram/histogram.js
    web/apps/VegaLab/examples/histogram/histogram.json
    web/apps/VegaLab/examples/histogram-json/histogram-json-data.json
    web/apps/VegaLab/examples/histogram-json/histogram-json.js
    web/apps/VegaLab/examples/histogram-json/histogram-json.json
    web/apps/VegaLab/examples/ordinal-bars/ordinal-bars.json
    web/apps/VegaLab/examples/vega-arc/vega-arc-data.json
    web/apps/VegaLab/examples/vega-arc/vega-arc.js
    web/apps/VegaLab/examples/vega-arc/vega-arc.json
    web/apps/VegaLab/examples/vega-bars/vega-bars-data.json
    web/apps/VegaLab/examples/vega-bars/vega-bars.json
    web/apps/VegaLab/examples/vega-data.js
    web/apps/VegaLab/examples/vega-image/vega-image.json
    web/apps/VegaLab/examples/vega-line/vega-line-data.js
    web/apps/VegaLab/examples/vega-line/vega-line.json
    web/apps/VegaLab/examples/vega-map/vega-map.json
    web/apps/VegaLab/examples/vega-stack_area/vega-stack_area-data.js
    web/apps/VegaLab/examples/vega-stack_area/vega-stack_area.json
    web/apps/VegaLab/examples/vega-stack_bars/vega-stack_bars-data.js
    web/apps/VegaLab/examples/vega-stack_bars/vega-stack_bars.json
    web/apps/VegaLab/examples/vega-symbol/vega-symbol-data.js
    web/apps/VegaLab/examples/vega-symbol/vega-symbol.json
    web/apps/VegaLab/examples/vega-treemap/vega-treemap-data.js
    web/apps/VegaLab/examples/vega-treemap/vega-treemap.json
    web/apps/VegaLab/index.html
    web/apps/VegaLab/lib/projection.js
    web/apps/VegaLab/vegalab.css
    web/apps/VegaLab/vegalab.js
    web/apps/Phylotree/heliconia.json
    web/apps/Phylotree/index.html
    web/apps/Phylotree/phylotree.js
    web/config/flickr-config.js
    web/config/flickr.html
    web/config/NER-config.js
    web/config/NER.html
    web/config/notfound.html
    web/lib/vgd3-template.js.txt
    web/css/xdataweb.css
    web/css/bootstrap.css
    web/css/bootstrap-xdata.css
    web/css/bootswatch/bootstrap-readable.css
    web/apps.json
    web/index.html
    web/index.js
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

set(MIN_JS_FILE ${CMAKE_BINARY_DIR}/${DEPLOY_DIR}/web/lib/xdataweb.min.js)

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
