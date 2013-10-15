cmake_minimum_required(VERSION 2.8)

# This project doesn't require any of the standard compilers, hence the "NONE"
# argument.
project(Tangelo NONE)

# Extend cmake module path.
list(APPEND CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/cmake")

# Cache variables.
set(DEPLOY_TEST_SERVICES OFF CACHE BOOL "Deploy the \"testing\" web service modules.")
set(DEPLOY_SERVICE_MONGO ON CACHE BOOL "Deploy the mongo.py service (depends on pymongo).")
set(DEPLOY_SERVICE_IMPALA ON CACHE BOOL "Deploy the impala-json.py service (depends on impala).")
set(DEPLOY_EXAMPLES OFF CACHE BOOL "Deploy web applications in the examples directory under the /examples URL (creates symlink).")
set(SERVER_HOSTNAME localhost CACHE STRING "The hostname of the machine that will run the server.")
set(SERVER_PORT 8080 CACHE STRING "The port the server will run on.")
set(DEPLOY_DOCUMENTATION OFF CACHE BOOL "Generate documentation for project.")
set(JSLINT OFF CACHE BOOL "Generate tests for JS source files using JSLint program.")

if("${WIN32}")
    set(SERVER_USER "windows" CACHE STRING "The user Tangelo will run as, if started as root (unused on Windows)." FORCE)
    set(SERVER_GROUP "windows" CACHE STRING "The group Tangelo will run as, if started as root (unused on Windows)." FORCE)
    mark_as_advanced(FORCE SERVER_USER SERVER_GROUP)
else()
    set(SERVER_USER $ENV{USER} CACHE STRING "The user Tangelo will run as, if started as root.")
    set(SERVER_GROUP "users" CACHE STRING "The group Tangelo will run as, if started as root.")
endif()

# Find a Python2.7 interpreter.  2.7 is required because of the use of
# dictionary comprehensions.
find_package(PythonInterp 2.7 REQUIRED)

# Find the cherrypy module.
include(cmake/FindPythonModule.cmake)
find_python_module(cherrypy 3.2 REQUIRED)

find_program(VTKPYTHON_EXECUTABLE vtkpython PATHS /usr/bin/vtkpython)

# These files should be validated with JSLint.
set(JS_LINT_FILES
    ${CMAKE_SOURCE_DIR}/web/js/core.js
    ${CMAKE_SOURCE_DIR}/web/js/controlPanel.js
    ${CMAKE_SOURCE_DIR}/web/js/date.js
    ${CMAKE_SOURCE_DIR}/web/js/GoogleMapSVG.js
    ${CMAKE_SOURCE_DIR}/web/js/navbar.js
    ${CMAKE_SOURCE_DIR}/web/js/svgColorLegend.js
    ${CMAKE_SOURCE_DIR}/web/js/landingPage.js
    ${CMAKE_SOURCE_DIR}/web/js/util.js
    ${CMAKE_SOURCE_DIR}/examples/index.js
    ${CMAKE_SOURCE_DIR}/examples/biofabric/biofabric.js
    ${CMAKE_SOURCE_DIR}/examples/enron/enron.js
    ${CMAKE_SOURCE_DIR}/examples/enron-impala/enron-imp.js
    ${CMAKE_SOURCE_DIR}/examples/ner/ner.js
    ${CMAKE_SOURCE_DIR}/examples/ssci/ssci.js
    ${CMAKE_SOURCE_DIR}/examples/flickr/flickr.js
)

# These files should be uglified and concatenated.
set(JS_UGLIFY_FILES
    ${CMAKE_SOURCE_DIR}/web/js/core.js
    ${CMAKE_SOURCE_DIR}/web/js/controlPanel.js
    ${CMAKE_SOURCE_DIR}/web/js/date.js
    ${CMAKE_SOURCE_DIR}/web/js/GoogleMapSVG.js
    ${CMAKE_SOURCE_DIR}/web/js/landingPage.js
    ${CMAKE_SOURCE_DIR}/web/js/navbar.js
    ${CMAKE_SOURCE_DIR}/web/js/resolve.js
    ${CMAKE_SOURCE_DIR}/web/js/svgColorLegend.js
    ${CMAKE_SOURCE_DIR}/web/js/util.js
    ${CMAKE_SOURCE_DIR}/web/js/ui/_package.js
    ${CMAKE_SOURCE_DIR}/web/js/ui/html.js
    ${CMAKE_SOURCE_DIR}/web/js/ui/rangeslider.js
    ${CMAKE_SOURCE_DIR}/web/js/ui/select.js
    ${CMAKE_SOURCE_DIR}/web/js/ui/split.js
    ${CMAKE_SOURCE_DIR}/web/js/vis/_package.js
    ${CMAKE_SOURCE_DIR}/web/js/vis/geodots.js
    ${CMAKE_SOURCE_DIR}/web/js/vis/geonodelink.js
    ${CMAKE_SOURCE_DIR}/web/js/vis/mapdots.js
    ${CMAKE_SOURCE_DIR}/web/js/vis/nodelink.js
    ${CMAKE_SOURCE_DIR}/web/js/vis/timebar.js
    ${CMAKE_SOURCE_DIR}/web/js/vis/timeline.js
)

# These files should be copied to the build directory.
set(SOURCES
    tangelo/__init__.py
    tangelo/__main__.py
    tangelo/minify_json.py
    tangelo/server.py
    tangelo/tool.py
    tangelo/util.py
    tangelo/websocket.py
    web/img/glyphicons-halflings-white.png
    web/img/glyphicons-halflings.png
    web/img/tangelo.ico
    web/img/Tangelo_Mark_256.png
    web/data/world-110m.json
    web/vega/geonodelink.json
    web/vega/timeline.json
    web/vega/timebar.json
    web/js/loader/cdn-fallback-bootstrap.js
    web/js/loader/cdn-fallback-bootstrap.min.js
    web/js/loader/cdn-fallback-d3.js
    web/js/loader/cdn-fallback-d3.min.js
    web/js/loader/cdn-fallback-jquery.js
    web/js/loader/cdn-fallback-jquery.min.js
    web/js/loader/load-bootstrap.js
    web/js/loader/load-bootstrap.min.js
    web/js/loader/load-d3.js
    web/js/loader/load-d3.min.js
    web/js/loader/load-jquery.js
    web/js/loader/load-jquery.min.js
    web/js/lib/bootstrap-2.3.0.js
    web/js/lib/bootstrap-2.3.0.min.js
    web/js/lib/d3.v3.js
    web/js/lib/d3.v3.min.js
    web/js/lib/dragslider.js
    web/js/lib/jquery-1.8.2.js
    web/js/lib/jquery-1.8.2.min.js
    web/js/lib/jquery-ui-1.9.1.js
    web/js/lib/md5.js
    web/js/lib/topojson.js
    web/js/lib/vega-1.0.0.js
    web/js/lib/vega-1.3.2.js
    web/css/bootstrap-readable.css
    web/css/jquery-ui-1.9.1.css
    web/css/tangelo.css
    web/img/glyphicons-halflings.png
    web/img/glyphicons-halflings-white.png
)

if(DEPLOY_SERVICE_MONGO)
    list(APPEND SOURCES
        web/service/mongo.py)
endif()

if(DEPLOY_SERVICE_IMPALA)
    list(APPEND SOURCES
        web/service/impala-json.py)
endif()

if(DEPLOY_TEST_SERVICES)
    list(APPEND SOURCES
        web/service/test/404.py
        web/service/test/broken.py
        web/service/test/echo.py
        web/service/test/exceptional.py
        web/service/test/restful.py
        web/service/test/testapp.py)
endif()

# Configure the shellscript testing driver.
configure_file(
    testing/tangelo-server-test.sh
    ${CMAKE_BINARY_DIR}/tangelo-server-test.sh
    @ONLY
)

# Configure the dd
configure_file(
    tangelod.in
    ${CMAKE_BINARY_DIR}/tangelod
    @ONLY
)

# Configure the vtkweb launcher.
configure_file(
    vtkweb-launcher.py.in
    ${CMAKE_BINARY_DIR}/vtkweb-launcher.py
)

# Configure the Tangelo password file generator.
configure_file(
    tangelo-passwd.in
    ${CMAKE_BINARY_DIR}/tangelo-passwd
)

# Configure main index.html.
if (${DEPLOY_EXAMPLES})
    set(index_file web/index-examples.html)
else()
    set(index_file web/index.html)
endif()
configure_file(
    ${index_file}
    ${CMAKE_BINARY_DIR}/web/index.html
)

# Configure load-tangelo.js and load-tangelo.min.js.
#
# Start by reading the contents of loader-preamble.js into a variable.
file(READ web/js/loader/loader-preamble.js LOADER_PREAMBLE)
configure_file(web/js/loader/load-tangelo.js.in ${CMAKE_BINARY_DIR}/web/js/loader/load-tangelo.js)
configure_file(web/js/loader/load-tangelo.min.js.in ${CMAKE_BINARY_DIR}/web/js/loader/load-tangelo.min.js)

function(copy_file f)
    set(outfile ${CMAKE_BINARY_DIR}/${f})
    add_custom_command(
        OUTPUT ${CMAKE_BINARY_DIR}/${f}
        COMMAND ${CMAKE_COMMAND} -E copy_if_different ${CMAKE_SOURCE_DIR}/${f} ${CMAKE_BINARY_DIR}/${f}
        DEPENDS ${f}
        COMMENT "Copying ${f} to build directory"
    )
    set_property(
        GLOBAL
        APPEND
        PROPERTY copied_files ${f}
    )
endfunction()

# Copy the files to the build directory.
foreach(m ${SOURCES})
    copy_file(${m})
endforeach()

# Uglify and concatenate the library js files.
#
# Set up options to create an unminified file.
if(WIN32)
    set(concatenator type)
else()
    set(concatenator cat)
endif()
set(output_operator ">")

# Use UglifyJS to create a minified file, falling back on an unminified file if
# it cannot be found.
find_package(UglifyJS)
if(UglifyJS_EXECUTABLE)
    set(min_concatenator ${UglifyJS_EXECUTABLE})
    set(min_output_operator "-o")
    set(min_mangle_flag "-m")
else()
    message(WARNING "Could not find UglifyJS - generating UNMINIFIED javascript file for tangelo.min.js")

    set(min_concatenator ${concatenator})
    set(min_output_operator ${output_operator})
    unset(min_mangle_flag)
endif()

set(MIN_JS_FILE ${CMAKE_BINARY_DIR}/web/js/tangelo.min.js)
set(JS_FILE ${CMAKE_BINARY_DIR}/web/js/tangelo.js)

add_custom_command(
    OUTPUT ${MIN_JS_FILE}
    COMMAND ${min_concatenator} ${JS_UGLIFY_FILES} ${min_mangle_flag} ${min_output_operator} ${MIN_JS_FILE}
    DEPENDS ${JS_UGLIFY_FILES}
    COMMENT "Creating minified javascript library"
)

add_custom_command(
    OUTPUT ${JS_FILE}
    COMMAND ${concatenator} ${JS_UGLIFY_FILES} ${mangle_flag} ${output_operator} ${JS_FILE}
    DEPENDS ${JS_UGLIFY_FILES}
    COMMENT "Creating unminified javascript library"
)

if(${DEPLOY_EXAMPLES})
    set(symlink_source ${CMAKE_SOURCE_DIR}/examples)
    set(symlink_target ${CMAKE_BINARY_DIR}/web/examples)
    if(${WIN32})
        string(REPLACE "/" "\\" symlink_source ${symlink_source})
        string(REPLACE "/" "\\" symlink_target ${symlink_target})
        set(symlink_command mklink /J ${symlink_target} ${symlink_source})
    else()
        set(symlink_command ${CMAKE_COMMAND} -E create_symlink ${symlink_source} ${symlink_target})
    endif()
    add_custom_command(
        OUTPUT ${symlink_target}
        COMMAND ${symlink_command}
        DEPENDS ${symlink_source}
        COMMENT "Creating symlink to examples"
    )    
    list(APPEND EXAMPLES_SYMLINK ${symlink_target})
endif()

# Generate documentation.
if(${DEPLOY_DOCUMENTATION})
    # Find Sphinx
    find_package(Sphinx REQUIRED)

    # A signal file to indicate the last time the documentation was built.
    set(DOCUMENTATION_STAMP ${CMAKE_BINARY_DIR}/documentation_stamp)

    set(DOCUMENTATION_SOURCES
        ${CMAKE_SOURCE_DIR}/docs/architecture.rst
        ${CMAKE_SOURCE_DIR}/docs/basic-usage.rst
        ${CMAKE_SOURCE_DIR}/docs/building-an-app.rst
        ${CMAKE_SOURCE_DIR}/docs/coding-style-guide.rst
        ${CMAKE_SOURCE_DIR}/docs/index.rst
        ${CMAKE_SOURCE_DIR}/docs/installation.rst
        ${CMAKE_SOURCE_DIR}/docs/integration.rst
        ${CMAKE_SOURCE_DIR}/docs/python-services.rst
        ${CMAKE_SOURCE_DIR}/docs/tangelo-js.rst
        ${CMAKE_SOURCE_DIR}/docs/tangelo-manpage.rst
        ${CMAKE_SOURCE_DIR}/docs/tangelo-passwd-manpage.rst
        ${CMAKE_SOURCE_DIR}/docs/tangelo-py.rst
        ${CMAKE_SOURCE_DIR}/docs/static/tangelo-sphinx.css
        ${CMAKE_SOURCE_DIR}/docs/templates/layout.html
    )

    set(DOCUMENTATION_CONTROL_FILE
        ${CMAKE_SOURCE_DIR}/docs/conf.py
    )

    # A command to generate the documentation.
    add_custom_command(
        OUTPUT ${DOCUMENTATION_STAMP}
        COMMAND ${Sphinx_EXECUTABLE} -b html ${CMAKE_SOURCE_DIR}/docs ${CMAKE_BINARY_DIR}/docs
        COMMAND ${CMAKE_COMMAND} -E touch ${DOCUMENTATION_STAMP}
        DEPENDS ${DOCUMENTATION_SOURCES} ${DOCUMENTATION_CONTROL_FILE}
        COMMENT "Generating documentation"
    )
endif()

# The top-level target.
#
# Get the list of all files that were copied to the build directory, and make
# sure they are added as targets.
get_property(ALL_COPIED_FILES GLOBAL PROPERTY copied_files)
add_custom_target(
    tangelo
    ALL
    DEPENDS ${ALL_COPIED_FILES} ${EXAMPLES_SYMLINK} ${MIN_JS_FILE} ${JS_FILE} ${DOCUMENTATION_STAMP}
)

# Testing
include(CTest)
enable_testing()

# JSLint tests.
if(${JSLINT})
    # Find JSLint.
    find_package(JSLint REQUIRED)

    # Generate the tests.
    foreach(f ${JS_LINT_FILES})
        add_test(jslint-${f} ${JSLint_EXECUTABLE} ${f})
    endforeach()
endif()

# Python web service tests.
set(PYTEST ${PYTHON_EXECUTABLE} ${CMAKE_BINARY_DIR}/tangelo-pytest.py)

if(NOT "${WIN32}")
    set(tester "${CMAKE_BINARY_DIR}/tangelo-server-test.sh")
    set(site "${SERVER_HOSTNAME}:${SERVER_PORT}")

    # curl uses \r at the ends of lines for some reason when reporting response
    # headers, so we include one at the end of our "expected string" lines.
    add_test(static-content ${tester}
        "curl --silent -I ${site} | head -n 1"
        "HTTP/1.1 200 OK\r"
    )

    add_test(geodots ${tester}
        "python ${CMAKE_SOURCE_DIR}/imagetest.py --name=geodots --url=http://${site}/app/testing/vis/geodots.html --baseline-url=http://${site}/app/testing/vis/geodots.png"
        "success"
    )

    add_test(resolve ${tester}
        "python ${CMAKE_SOURCE_DIR}/examples/testing/resolve/test.py"
        "success"
    )

    if(DEPLOY_TEST_SERVICES)
        add_test(rest-get ${tester}
            "curl --silent -X GET ${site}/service/test/restful/one/two/three?foo=bar"
            "GET: one two three{'foo': u'bar'}"
        )

        add_test(rest-post ${tester}
            "curl --silent -X POST -d foo=bar ${site}/service/test/restful/one/two/three"
            "POST: one two three{'foo': u'bar'}"
        )

        add_test(404-not-found ${tester}
            "curl --silent -I ${site}/service/test/404 | head -n 1"
            "HTTP/1.1 404 Not Found\r"
        )

        add_test(service-ner ${tester}
            "curl --silent \"${site}/app/ner/service/ner?text=Toto,+I've+got+a+feeling+we're+not+in+Kansas+anymore.\""
            "{\"result\": [[\"GPE\", \"Toto\"], [\"GPE\", \"Kansas\"]], \"error\": null}"
        )

        add_test(service-echo-blank ${tester}
            "curl --silent ${site}/service/test/echo"
            "(No arguments passed)"
        )

        add_test(service-echo ${tester}
            "curl --silent \"${site}/service/test/echo/jan/feb/mar?color=red&answer=42\""
            "[jan, feb, mar]\ncolor -> red\nanswer -> 42"
        )
    endif()
endif()
