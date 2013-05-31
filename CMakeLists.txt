cmake_minimum_required(VERSION 2.8)

# This project doesn't require any of the standard compilers, hence the "NONE"
# argument.
project(Tangelo NONE)

# Extend cmake module path.
list(APPEND CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/cmake")

# Cache variables.
set(DEPLOY_TEST_SERVICES OFF CACHE BOOL "Deploy the \"testing\" web service modules.")
set(DEPLOY_EXAMPLES OFF CACHE BOOL "Deploy web applications in the examples directory under the /app URL (creates symlink).")
set(SERVER_HOSTNAME localhost CACHE STRING "The hostname of the machine that will run the server.")
set(SERVER_PORT 8080 CACHE STRING "The port the server will run on.")
set(MINIFY_JAVASCRIPT OFF CACHE BOOL "Minify the JavaScript files prior to concatenating.")
set(MANGLE_JAVASCRIPT OFF CACHE BOOL "When minifying, also mangle non-public symbol names.")
set(BUILD_DOCUMENTATION OFF CACHE BOOL "Generate documentation for project.")
set(JSLINT OFF CACHE BOOL "Generate tests for JS source files using JSLint program.")

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

# Find a Python2.7 interpreter.  2.7 is required because of the use of
# dictionary comprehensions.
find_package(PythonInterp 2.7 REQUIRED)

# Find the cherrypy module.
include(cmake/FindPythonModule.cmake)
find_python_module(cherrypy 3.2 REQUIRED)

# These files should be validated with JSLint.
set(JS_LINT_FILES
    ${CMAKE_SOURCE_DIR}/web/lib/core.js
    ${CMAKE_SOURCE_DIR}/web/lib/defaults.js
    ${CMAKE_SOURCE_DIR}/web/lib/date.js
    ${CMAKE_SOURCE_DIR}/web/lib/util.js
    ${CMAKE_SOURCE_DIR}/examples/index.js
    ${CMAKE_SOURCE_DIR}/examples/biofabric/biofabric.js
    ${CMAKE_SOURCE_DIR}/examples/enron/enron.js
    ${CMAKE_SOURCE_DIR}/examples/enron-impala/enron-imp.js
    ${CMAKE_SOURCE_DIR}/examples/ner/ner.js
    ${CMAKE_SOURCE_DIR}/examples/stats/stats.js
    ${CMAKE_SOURCE_DIR}/examples/datatwiddle/datatwiddle.js
    ${CMAKE_SOURCE_DIR}/examples/vegalab/vegalab.js
    ${CMAKE_SOURCE_DIR}/examples/ssci/ssci.js
    ${CMAKE_SOURCE_DIR}/examples/flickr/flickr.js
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
    web/service/impala-json.py
)

if(DEPLOY_TEST_SERVICES)
    list(APPEND SOURCES
        web/service/404.py
        web/service/broken.py
        web/service/exceptional.py
        web/service/restful.py
        web/service/testapp.py)
endif()

# Configure the shellscript testing driver.
configure_file(
    testing/tangelo-server-test.sh
    ${CMAKE_BINARY_DIR}/tangelo-server-test.sh
    @ONLY
)

# Configure the Tangelo control script.
configure_file(
    tangelo.in
    ${CMAKE_BINARY_DIR}/${DEPLOY_DIR}/tangelo
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
    ${DEPLOY_DIR}/web/index.html
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

if(${DEPLOY_EXAMPLES})
    add_custom_command(
        OUTPUT ${CMAKE_BINARY_DIR}/${DEPLOY_DIR}/web/app
        COMMAND ${CMAKE_COMMAND} -E create_symlink ${CMAKE_SOURCE_DIR}/examples ${CMAKE_BINARY_DIR}/${DEPLOY_DIR}/web/app
        DEPENDS ${CMAKE_SOURCE_DIR}/examples
    )    
    list(APPEND ALL_TARGETS ${CMAKE_BINARY_DIR}/${DEPLOY_DIR}/web/app)
endif()

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

    if(DEPLOY_TEST_SERVICES)
        add_test(rest-get ${tester}
            "curl --silent -X GET ${site}/service/restful/one/two/three?foo=bar"
            "GET: one two three{'foo': u'bar'}"
        )

        add_test(rest-post ${tester}
            "curl --silent -X POST -d foo=bar ${site}/service/restful/one/two/three"
            "POST: one two three{'foo': u'bar'}"
        )

        add_test(404-not-found ${tester}
            "curl --silent -I ${site}/service/404 | head -n 1"
            "HTTP/1.1 404 Not Found\r"
        )

        add_test(service-ner ${tester}
            "curl --silent \"${site}/app/ner/service/ner?text=Toto,+I've+got+a+feeling+we're+not+in+Kansas+anymore.\""
            "{\"result\": [[\"GPE\", \"Toto\"], [\"GPE\", \"Kansas\"]], \"error\": null}"
        )

        add_test(service-echo-blank ${tester}
            "curl --silent ${site}/service/echo"
            "(No arguments passed)"
        )

        add_test(service-echo ${tester}
            "curl --silent \"${site}/service/echo/jan/feb/mar?color=red&answer=42\""
            "[jan, feb, mar]\ncolor -> red\nanswer -> 42"
        )
    endif()
endif()
