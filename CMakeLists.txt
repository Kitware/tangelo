cmake_minimum_required(VERSION 2.8)

# This project doesn't require any of the standard compilers, hence the "NONE"
# argument.
project(XDATA-Web NONE)

# Extend cmake module path.
list(APPEND CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/cmake")

# Cache variables.
set(DEPLOY_TEST_SERVICES OFF CACHE BOOL "Deploy the \"testing\" web service modules.")
set(SERVER_HOSTNAME localhost CACHE STRING "The hostname of the machine that will run the server.")
set(SERVER_PORT 8080 CACHE STRING "The port the server will run on.")
set(MINIFY_JAVASCRIPT OFF CACHE BOOL "Minify the JavaScript files prior to concatenating.")
set(MANGLE_JAVASCRIPT OFF CACHE BOOL "When minifying, also mangle non-public symbol names.")
set(BUILD_DOCUMENTATION OFF CACHE BOOL "Generate documentation for project.")

if("${WIN32}")
    set(SERVER_USER "windows" CACHE STRING "The user Tangelo will run as, if started as root (unused on Windows)." FORCE)
    set(SERVER_GROUP "windows" CACHE STRING "The group Tangelo will run as, if started as root (unused on Windows)." FORCE)
    mark_as_advanced(FORCE SERVER_USER SERVER_GROUP)
else()
    set(SERVER_USER $ENV{USER} CACHE STRING "The user Tangelo will run as, if started as root.")
    set(SERVER_GROUP "users" CACHE STRING "The group Tangelo will run as, if started as root.")
endif()

# Non-cache variables.
set(DEPLOY_DIR deploy)

# Find JSLint.
find_package(JSLint)

# Find a Python2 interpreter.
find_package(PythonInterp 2.7)

# Find CherryPy daemon.
find_package(CherryPy)

# These files should be validated with JSLint.
set(JS_LINT_FILES
    ${CMAKE_SOURCE_DIR}/web/index.js
    ${CMAKE_SOURCE_DIR}/web/lib/core.js
    ${CMAKE_SOURCE_DIR}/web/lib/defaults.js
    ${CMAKE_SOURCE_DIR}/web/lib/date.js
    ${CMAKE_SOURCE_DIR}/web/lib/util.js
    ${CMAKE_SOURCE_DIR}/web/app/biofabric/biofabric.js
    ${CMAKE_SOURCE_DIR}/web/app/enron/enron.js
    ${CMAKE_SOURCE_DIR}/web/app/ner/ner.js
    ${CMAKE_SOURCE_DIR}/web/app/stats/stats.js
    ${CMAKE_SOURCE_DIR}/web/app/datatwiddle/datatwiddle.js
    ${CMAKE_SOURCE_DIR}/web/app/vegalab/vegalab.js
    ${CMAKE_SOURCE_DIR}/web/app/ssci/ssci.js
    ${CMAKE_SOURCE_DIR}/web/app/flickr/flickr.js
    ${CMAKE_SOURCE_DIR}/web/app/noaa/climate.js
)

# These files should be uglified and concatenated.
set(JS_UGLIFY_FILES
    ${CMAKE_SOURCE_DIR}/web/lib/core.js
    ${CMAKE_SOURCE_DIR}/web/lib/defaults.js
    ${CMAKE_SOURCE_DIR}/web/lib/date.js
    ${CMAKE_SOURCE_DIR}/web/lib/util.js
    ${CMAKE_SOURCE_DIR}/web/lib/vgd3.js
    ${CMAKE_SOURCE_DIR}/web/lib/vg.util.js
)

# These files should be copied to the deployment directory.
set(SOURCES
    tangelo.py
    web/apps.json
    web/index.html
    web/index.js
    web/app/biofabric/biofabric.js
    web/app/biofabric/index.html
    web/app/biofabric/miserables.json
    web/app/charitynet/service/charitynet.py
    web/app/charitynet/charitynet.js
    web/app/charitynet/index.html
    web/app/charitynet/us-counties.json
    web/app/charitynet/us-states.json
    web/app/charitynet/choropleth.json
    web/app/noaa/index.html
    web/app/noaa/climate.js
    web/app/noaa/circularHeatChart.js
    web/app/noaa/sealevel.csv
    web/app/datatwiddle/datatwiddle.js
    web/app/datatwiddle/index.html
    web/app/datatwiddle/service/datatwiddle.py
    web/app/enron/enron.js
    web/app/enron/index.html
    web/app/enron/service/emailers.py
    web/app/flickr/flickr.js
    web/app/flickr/index.html
    web/app/ner/index.html
    web/app/ner/letters.csv
    web/app/ner/ner.css
    web/app/ner/ner.js
    web/app/ner/data/letters-from-abbottabad/control.json
    web/app/ner/data/letters-from-abbottabad/SOCOM-2012-0000003.txt
    web/app/ner/data/letters-from-abbottabad/SOCOM-2012-0000004.txt
    web/app/ner/data/letters-from-abbottabad/SOCOM-2012-0000005.txt
    web/app/ner/data/letters-from-abbottabad/SOCOM-2012-0000006.txt
    web/app/ner/data/letters-from-abbottabad/SOCOM-2012-0000007.txt
    web/app/ner/data/letters-from-abbottabad/SOCOM-2012-0000008.txt
    web/app/ner/data/letters-from-abbottabad/SOCOM-2012-0000009.txt
    web/app/ner/data/letters-from-abbottabad/SOCOM-2012-0000010.txt
    web/app/ner/data/letters-from-abbottabad/SOCOM-2012-0000011.txt
    web/app/ner/data/letters-from-abbottabad/SOCOM-2012-0000012.txt
    web/app/ner/data/letters-from-abbottabad/SOCOM-2012-0000013.txt
    web/app/ner/data/letters-from-abbottabad/SOCOM-2012-0000014.txt
    web/app/ner/data/letters-from-abbottabad/SOCOM-2012-0000015.txt
    web/app/ner/data/letters-from-abbottabad/SOCOM-2012-0000016.txt
    web/app/ner/data/letters-from-abbottabad/SOCOM-2012-0000017.txt
    web/app/ner/data/letters-from-abbottabad/SOCOM-2012-0000018.txt
    web/app/ner/data/letters-from-abbottabad/SOCOM-2012-0000019.txt
    web/app/ner/service/ner.py
    web/app/ner/service/nermongo.py
    web/app/ssci/index.html
    web/app/ssci/ssci.js
    web/app/ssci/ssci.json
    web/app/ssci/data/animals_data.json
    web/app/ssci/data/Cc_73524567995_00.json
    web/app/ssci/data/Cc_73524568270_01.json
    web/app/ssci/data/Cc_73524568278_02.json
    web/app/ssci/data/Cc_73524568287_03.json
    web/app/ssci/data/Cc_73524568298_04.json
    web/app/ssci/data/Cc_73524568305_05.json
    web/app/ssci/data/Cc_73524568313_06.json
    web/app/ssci/data/Cc_73524568322_07.json
    web/app/ssci/data/Cc_73524568328_08.json
    web/app/ssci/data/Cc_73524568338_09.json
    web/app/ssci/data/Cc_73524568345_10.json
    web/app/ssci/data/Cc_73524568352_11.json
    web/app/ssci/data/Cr_73524567995_00.json
    web/app/ssci/data/Cr_73524568270_01.json
    web/app/ssci/data/Cr_73524568278_02.json
    web/app/ssci/data/Cr_73524568287_03.json
    web/app/ssci/data/Cr_73524568298_04.json
    web/app/ssci/data/Cr_73524568305_05.json
    web/app/ssci/data/Cr_73524568313_06.json
    web/app/ssci/data/Cr_73524568322_07.json
    web/app/ssci/data/Cr_73524568328_08.json
    web/app/ssci/data/Cr_73524568338_09.json
    web/app/ssci/data/Cr_73524568345_10.json
    web/app/ssci/data/Cr_73524568352_11.json
    web/app/ssci/data/XD_73524567995_00.json
    web/app/ssci/data/XD_73524568270_01.json
    web/app/ssci/data/XD_73524568278_02.json
    web/app/ssci/data/XD_73524568287_03.json
    web/app/ssci/data/XD_73524568298_04.json
    web/app/ssci/data/XD_73524568305_05.json
    web/app/ssci/data/XD_73524568313_06.json
    web/app/ssci/data/XD_73524568322_07.json
    web/app/ssci/data/XD_73524568328_08.json
    web/app/ssci/data/XD_73524568338_09.json
    web/app/ssci/data/XD_73524568345_10.json
    web/app/ssci/data/XD_73524568352_11.json
    web/app/ssci/data/XL_73524567995_00.json
    web/app/ssci/data/XL_73524568270_01.json
    web/app/ssci/data/XL_73524568278_02.json
    web/app/ssci/data/XL_73524568287_03.json
    web/app/ssci/data/XL_73524568298_04.json
    web/app/ssci/data/XL_73524568305_05.json
    web/app/ssci/data/XL_73524568313_06.json
    web/app/ssci/data/XL_73524568322_07.json
    web/app/ssci/data/XL_73524568328_08.json
    web/app/ssci/data/XL_73524568338_09.json
    web/app/ssci/data/XL_73524568345_10.json
    web/app/ssci/data/XL_73524568352_11.json
    web/app/stats/index.html
    web/app/stats/stats.js
    web/app/vegabuilder/index.html
    web/app/vegabuilder/vegabuilder.js
    web/app/vegabuilder/arc.json
    web/app/vegabuilder/bar.json
    web/app/vegabuilder/table.json
    web/app/vegalab/data/7zip.png
    web/app/vegalab/data/cities.json
    web/app/vegalab/data/ffox.png
    web/app/vegalab/data/gimp.png
    web/app/vegalab/data/letters.json
    web/app/vegalab/data/world-countries.json
    web/app/vegalab/examples/histogram/histogram-data.js
    web/app/vegalab/examples/histogram/histogram.js
    web/app/vegalab/examples/histogram/histogram.json
    web/app/vegalab/examples/histogram-json/histogram-json-data.js
    web/app/vegalab/examples/histogram-json/histogram-json.js
    web/app/vegalab/examples/histogram-json/histogram-json.json
    web/app/vegalab/examples/ordinal-bars/ordinal-bars.json
    web/app/vegalab/examples/vega-arc/vega-arc-data.js
    web/app/vegalab/examples/vega-arc/vega-arc.js
    web/app/vegalab/examples/vega-arc/vega-arc.json
    web/app/vegalab/examples/vega-bars/vega-bars-data.json
    web/app/vegalab/examples/vega-bars/vega-bars.json
    web/app/vegalab/examples/vega-data.js
    web/app/vegalab/examples/vega-image/vega-image.json
    web/app/vegalab/examples/vega-line/vega-line-data.js
    web/app/vegalab/examples/vega-line/vega-line.json
    web/app/vegalab/examples/vega-map/vega-map.json
    web/app/vegalab/examples/vega-stack_area/vega-stack_area-data.js
    web/app/vegalab/examples/vega-stack_area/vega-stack_area.json
    web/app/vegalab/examples/vega-stack_bars/vega-stack_bars-data.js
    web/app/vegalab/examples/vega-stack_bars/vega-stack_bars.json
    web/app/vegalab/examples/vega-symbol/vega-symbol-data.js
    web/app/vegalab/examples/vega-symbol/vega-symbol.json
    web/app/vegalab/examples/vega-treemap/vega-treemap-data.js
    web/app/vegalab/examples/vega-treemap/vega-treemap.json
    web/app/vegalab/index.html
    web/app/vegalab/lib/projection.js
    web/app/vegalab/vegalab.css
    web/app/vegalab/vegalab.js
    web/app/phylotree/service/phylomongo.py
    web/app/phylotree/index.html
    web/app/phylotree/phylotree.js
    web/arbor/arbor.js
    web/arbor/arbor-apps.json
    web/arbor/index.html
    web/img/glyphicons-halflings-white.png
    web/img/glyphicons-halflings.png
    web/img/tangelo.ico
    web/lib/bootstrap.js
    web/lib/d3.v3.min.js
    web/lib/jquery-1.8.2.min.js
    web/lib/jquery-ui-1.9.1.js
    web/lib/md5.js
    web/lib/vega.js
    web/lib/vgd3-template.js.txt
    web/css/bootstrap-readable.css
    web/css/jquery-ui-1.9.1.css
    web/css/tangelo.css
    web/img/glyphicons-halflings.png
    web/img/glyphicons-halflings-white.png
    web/service/census.py
    web/service/echo.py
    web/service/mongo.py
)

if(DEPLOY_TEST_SERVICES)
    list(APPEND SOURCES
        web/service/broken.py
        web/service/exceptional.py
        web/service/testapp.py)
endif()

# Configure the Python testing driver.
configure_file(
    testing/tangelo-pytest.py.in
    ${CMAKE_BINARY_DIR}/tangelo-pytest.py
)

configure_file(
    tangelo.in
    ${CMAKE_BINARY_DIR}/${DEPLOY_DIR}/tangelo
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
if(${MINIFY_JAVASCRIPT} OR ${MANGLE_JAVASCRIPT})
    find_package(UglifyJS REQUIRED)
    set(concatenator ${UglifyJS_EXECUTABLE})
    set(output_operator "-o")

    if(NOT ${MINIFY_JAVASCRIPT})
        set(MINIFY_FLAG "-b")
    else()
        unset(MINIFY_FLAG)
    endif()

    if(${MANGLE_JAVASCRIPT})
        set(MANGLE_FLAG "-m")
    else()
        unset(MANGLE_FLAG)
    endif()
else()
    # TODO(choudhury): if platform is windows, use "type" instead of "cat"
    set(concatenator cat)
    set(output_operator ">")

    unset(MINIFY_FLAG)
    unset(MANGLE_FLAG)
endif()

set(MIN_JS_FILE ${CMAKE_BINARY_DIR}/${DEPLOY_DIR}/web/lib/tangelo.min.js)

add_custom_command(
    OUTPUT ${MIN_JS_FILE}
    COMMAND ${concatenator} ${JS_UGLIFY_FILES} ${MINIFY_FLAG} ${MANGLE_FLAG} ${output_operator} ${MIN_JS_FILE}
    DEPENDS ${JS_UGLIFY_FILES}
)

# Generate documentation.
if(${BUILD_DOCUMENTATION})
    # Find Sphinx
    find_package(Sphinx REQUIRED)

    # A signal file to indicate the last time the documentation was built.
    set(DOCUMENTATION_STAMP ${CMAKE_BINARY_DIR}/documentation_stamp)

    set(DOCUMENTATION_SOURCES
        ${CMAKE_SOURCE_DIR}/docs/index.rst
    )

    # A command to generate the documentation.
    add_custom_command(
        OUTPUT ${DOCUMENTATION_STAMP}
        COMMAND ${Sphinx_EXECUTABLE} -b html ${CMAKE_SOURCE_DIR}/docs ${CMAKE_BINARY_DIR}/docs
        COMMAND ${CMAKE_COMMAND} -E touch ${DOCUMENTATION_STAMP}
        DEPENDS ${DOCUMENTATION_SOURCES}
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
if(${JSLINT_FOUND})
    foreach(f ${JS_LINT_FILES})
        add_test(jslint-${f} ${JSLint_EXECUTABLE} ${f})
    endforeach()
endif()

# Python web service tests.
set(PYTEST ${PYTHON_EXECUTABLE} ${CMAKE_BINARY_DIR}/tangelo-pytest.py)

add_test(service-ner ${PYTEST} "app/ner/" ner "Toto, I've got a feeling we're not in Kansas anymore." "{\"result\": [[\"GPE\", \"Toto\"], [\"GPE\", \"Kansas\"]], \"error\": null}")

if(DEPLOY_TEST_SERVICES)
    add_test(service-echo-blank ${PYTEST} "" echo "(No arguments passed)")
    add_test(service-echo ${PYTEST} "" echo jan feb mar color=red answer=42 "[jan, feb, mar]\ncolor -> red\nanswer -> 42\n")
endif()
