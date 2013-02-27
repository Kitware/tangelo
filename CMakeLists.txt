cmake_minimum_required(VERSION 2.8)
project(XDATA-Web)

# Extend cmake module path.
list(APPEND CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/cmake")

# Cache variables.
set(DEPLOY_TEST_SERVICES OFF CACHE BOOL "Deploy the \"testing\" web service modules.")
set(SERVER_HOSTNAME localhost CACHE STRING "The hostname of the machine that will run the server.")
set(SERVER_PORT 8080 CACHE STRING "The port the server will run on.")
set(MINIFY ON CACHE BOOL "Minify the JavaScript files prior to concatenating.")
set(MANGLE ON CACHE BOOL "When minifying, also mangle non-public symbol names.")
set(DOCUMENT ON CACHE BOOL "Generate documentation for JavaScript files.")

# Non-cache variables.
set(DEPLOY_DIR deploy)

# Find JSLint.
find_package(JSLint)

# Find UglifyJS.
find_package(UglifyJS REQUIRED)

# Find JSDoc.
find_package(JSDoc)

# Find a Python2 interpreter.
find_package(PythonInterp 2.7)

# Create a "stamps" directory for storing fake targets for custom commands.
file(MAKE_DIRECTORY ${CMAKE_BINARY_DIR}/stamps)

# These files should be validated with JSLint.
set(JS_LINT_FILES
    ${CMAKE_SOURCE_DIR}/web/index.js
    #${CMAKE_SOURCE_DIR}/web/lib/id.js
    ${CMAKE_SOURCE_DIR}/web/lib/slider.js
    ${CMAKE_SOURCE_DIR}/web/lib/date.js
    #${CMAKE_SOURCE_DIR}/web/lib/barchart.js
    ${CMAKE_SOURCE_DIR}/web/apps/NER/NER.js
    ${CMAKE_SOURCE_DIR}/web/apps/NER/NER-config.js
    ${CMAKE_SOURCE_DIR}/web/apps/stats/stats.js
    ${CMAKE_SOURCE_DIR}/web/apps/DataTwiddle/DataTwiddle.js
    ${CMAKE_SOURCE_DIR}/web/apps/VegaLab/vegalab.js
    ${CMAKE_SOURCE_DIR}/web/apps/ssci/ssci.js
    ${CMAKE_SOURCE_DIR}/web/apps/flickr/flickr.js
    ${CMAKE_SOURCE_DIR}/web/apps/flickr/flickr-config.js
    ${CMAKE_SOURCE_DIR}/web/apps/mapping/mapping.js
    ${CMAKE_SOURCE_DIR}/web/apps/noaa/climate.js
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

# These files should have documentation generated for them.
set(JS_DOCUMENT_FILES
    ${CMAKE_SOURCE_DIR}/web/lib/date.js
    ${CMAKE_SOURCE_DIR}/web/lib/slider.js
    ${CMAKE_SOURCE_DIR}/web/lib/xdw.js
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
    web/apps/noaa/index.html
    web/apps/noaa/climate.js
    web/apps/noaa/circularHeatChart.js
    web/apps/noaa/sealevel.csv
    web/apps/DataTwiddle/DataTwiddle.js
    web/apps/DataTwiddle/index.html
    web/apps/flickr/flickr.js
    web/apps/flickr/index.html
    web/apps/flickr/flickr-config.js
    web/apps/flickr/flickr-config.html
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
    web/apps/NER/NER-config.js
    web/apps/NER/NER-config.html
    web/apps/ssci/index.html
    web/apps/ssci/ssci.js
    web/apps/ssci/ssci.json
    web/apps/ssci/data/animals_data.json
    web/apps/ssci/data/Cc_73524567995_00.json
    web/apps/ssci/data/Cc_73524568270_01.json
    web/apps/ssci/data/Cc_73524568278_02.json
    web/apps/ssci/data/Cc_73524568287_03.json
    web/apps/ssci/data/Cc_73524568298_04.json
    web/apps/ssci/data/Cc_73524568305_05.json
    web/apps/ssci/data/Cc_73524568313_06.json
    web/apps/ssci/data/Cc_73524568322_07.json
    web/apps/ssci/data/Cc_73524568328_08.json
    web/apps/ssci/data/Cc_73524568338_09.json
    web/apps/ssci/data/Cc_73524568345_10.json
    web/apps/ssci/data/Cc_73524568352_11.json
    web/apps/ssci/data/Cr_73524567995_00.json
    web/apps/ssci/data/Cr_73524568270_01.json
    web/apps/ssci/data/Cr_73524568278_02.json
    web/apps/ssci/data/Cr_73524568287_03.json
    web/apps/ssci/data/Cr_73524568298_04.json
    web/apps/ssci/data/Cr_73524568305_05.json
    web/apps/ssci/data/Cr_73524568313_06.json
    web/apps/ssci/data/Cr_73524568322_07.json
    web/apps/ssci/data/Cr_73524568328_08.json
    web/apps/ssci/data/Cr_73524568338_09.json
    web/apps/ssci/data/Cr_73524568345_10.json
    web/apps/ssci/data/Cr_73524568352_11.json
    web/apps/ssci/data/XD_73524567995_00.json
    web/apps/ssci/data/XD_73524568270_01.json
    web/apps/ssci/data/XD_73524568278_02.json
    web/apps/ssci/data/XD_73524568287_03.json
    web/apps/ssci/data/XD_73524568298_04.json
    web/apps/ssci/data/XD_73524568305_05.json
    web/apps/ssci/data/XD_73524568313_06.json
    web/apps/ssci/data/XD_73524568322_07.json
    web/apps/ssci/data/XD_73524568328_08.json
    web/apps/ssci/data/XD_73524568338_09.json
    web/apps/ssci/data/XD_73524568345_10.json
    web/apps/ssci/data/XD_73524568352_11.json
    web/apps/ssci/data/XL_73524567995_00.json
    web/apps/ssci/data/XL_73524568270_01.json
    web/apps/ssci/data/XL_73524568278_02.json
    web/apps/ssci/data/XL_73524568287_03.json
    web/apps/ssci/data/XL_73524568298_04.json
    web/apps/ssci/data/XL_73524568305_05.json
    web/apps/ssci/data/XL_73524568313_06.json
    web/apps/ssci/data/XL_73524568322_07.json
    web/apps/ssci/data/XL_73524568328_08.json
    web/apps/ssci/data/XL_73524568338_09.json
    web/apps/ssci/data/XL_73524568345_10.json
    web/apps/ssci/data/XL_73524568352_11.json
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
    web/img/glyphicons-halflings-white.png
    web/img/glyphicons-halflings.png
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

# Configure the Python testing driver.
configure_file(
    testing/xdwpytest.py.in
    ${CMAKE_BINARY_DIR}/xdwpytest.py
)

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
    COMMAND ${UglifyJS_EXECUTABLE} -o ${MIN_JS_FILE} ${JS_UGLIFY_FILES} ${MINIFY_FLAG} ${MANGLE_FLAG}
    DEPENDS ${JS_UGLIFY_FILES}
)

# Generate documentation.
set(DOCUMENTATION_STAMP ${CMAKE_BINARY_DIR}/stamps/documentation.txt)
set(DOCUMENTATION_DIR ${CMAKE_BINARY_DIR}/jsdoc)
if(${DOCUMENT})
    add_custom_command(
        OUTPUT ${DOCUMENTATION_STAMP}
        COMMAND ${CMAKE_COMMAND} -E remove_directory ${DOCUMENTATION_DIR}
        COMMAND ${JSDoc_EXECUTABLE} ${JSDoc_ARGS} ${JS_DOCUMENT_FILES} -p -d=${DOCUMENTATION_DIR}
        COMMAND ${CMAKE_COMMAND} -E touch ${DOCUMENTATION_STAMP}
        DEPENDS ${JS_DOCUMENT_FILES}
    )

    # Remove the stamp file, which may have been trivially generated in a
    # previous configure step by the else portion of this if-block.
    file(REMOVE ${DOCUMENTATION_STAMP})
else()
    # Use a dummy custom command rather than a call to file() in case someone
    # deletes the stamp file for some reason.  In that case, the custom command
    # will regenerate the file without complaints, whereas the call to file()
    # wouldn't, instead resulting in an error.
    add_custom_command(
        OUTPUT ${DOCUMENTATION_STAMP}
        COMMAND ${CMAKE_COMMAND} -E touch ${DOCUMENTATION_STAMP}
    )
endif()

# The top-level target.
add_custom_target(
    deploy
    ALL
    DEPENDS ${ALL_TARGETS} ${MIN_JS_FILE} ${DOCUMENTATION_STAMP}
)

# Testing
include(CTest)
enable_testing()

# JSLint tests.
foreach(f ${JS_LINT_FILES})
    add_test(jslint-${f} ${JSLint_EXECUTABLE} ${f})
endforeach()

# Python web service tests.
set(PYTEST ${PYTHON_EXECUTABLE} ${CMAKE_BINARY_DIR}/xdwpytest.py)

add_test(xdw-NER ${PYTEST} NER "Toto, I've got a feeling we're not in Kansas anymore." "{\"result\": [[\"GPE\", \"Toto\"], [\"GPE\", \"Kansas\"]], \"error\": null}")

if(DEPLOY_TEST_SERVICES)
    add_test(xdw-echo-blank ${PYTEST} echo "(No arguments passed)")
    add_test(xdw-echo ${PYTEST} echo jan feb mar color=red answer=42 "[jan, feb, mar]\ncolor -> red\nanswer -> 42\n")
endif()
