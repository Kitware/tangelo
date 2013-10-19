cmake_minimum_required(VERSION 2.8)

# This project doesn't require any of the standard compilers, hence the "NONE"
# argument.
project(Tangelo NONE)

# Extend cmake module path.
list(APPEND CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/cmake")

# Cache variables.
set(DEPLOY_DOCUMENTATION OFF CACHE BOOL "Generate documentation for project.")
set(JSLINT OFF CACHE BOOL "Generate tests for JS source files using JSLint program.")

# These files should be validated with JSLint.
set(JS_LINT_FILES
    ${CMAKE_SOURCE_DIR}/src/js/core.js
    ${CMAKE_SOURCE_DIR}/src/js/controlPanel.js
    ${CMAKE_SOURCE_DIR}/src/js/date.js
    ${CMAKE_SOURCE_DIR}/src/js/GoogleMapSVG.js
    ${CMAKE_SOURCE_DIR}/src/js/navbar.js
    ${CMAKE_SOURCE_DIR}/src/js/svgColorLegend.js
    ${CMAKE_SOURCE_DIR}/src/js/landingPage.js
    ${CMAKE_SOURCE_DIR}/src/js/util.js
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
    ${CMAKE_SOURCE_DIR}/src/js/core.js
    ${CMAKE_SOURCE_DIR}/src/js/controlPanel.js
    ${CMAKE_SOURCE_DIR}/src/js/date.js
    ${CMAKE_SOURCE_DIR}/src/js/GoogleMapSVG.js
    ${CMAKE_SOURCE_DIR}/src/js/landingPage.js
    ${CMAKE_SOURCE_DIR}/src/js/navbar.js
    ${CMAKE_SOURCE_DIR}/src/js/resolve.js
    ${CMAKE_SOURCE_DIR}/src/js/svgColorLegend.js
    ${CMAKE_SOURCE_DIR}/src/js/util.js
    ${CMAKE_SOURCE_DIR}/src/js/ui/_package.js
    ${CMAKE_SOURCE_DIR}/src/js/ui/html.js
    ${CMAKE_SOURCE_DIR}/src/js/ui/rangeslider.js
    ${CMAKE_SOURCE_DIR}/src/js/ui/select.js
    ${CMAKE_SOURCE_DIR}/src/js/ui/split.js
    ${CMAKE_SOURCE_DIR}/src/js/vis/_package.js
    ${CMAKE_SOURCE_DIR}/src/js/vis/geodots.js
    ${CMAKE_SOURCE_DIR}/src/js/vis/geonodelink.js
    ${CMAKE_SOURCE_DIR}/src/js/vis/mapdots.js
    ${CMAKE_SOURCE_DIR}/src/js/vis/nodelink.js
    ${CMAKE_SOURCE_DIR}/src/js/vis/timebar.js
    ${CMAKE_SOURCE_DIR}/src/js/vis/timeline.js
)

function(glob_recurse_ungit var path)
    file(GLOB_RECURSE all_files RELATIVE ${CMAKE_SOURCE_DIR} ${path})
    foreach(f ${all_files})
        string(FIND ${f} ".git" index)
        if(${index} EQUAL -1)
            list(APPEND files ${f})
        endif()
    endforeach()

    set(${var} ${files} PARENT_SCOPE)
endfunction()

# These files should be copied to the build directory.
glob_recurse_ungit(TANGELO_SOURCES Tangelo/*)

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

# Configure load-tangelo.js and load-tangelo.min.js.
#
# Start by reading the contents of loader-preamble.js into a variable.
file(READ src/js/loader/loader-preamble.js LOADER_PREAMBLE)
configure_file(src/js/loader/load-tangelo.js.in ${CMAKE_BINARY_DIR}/Tangelo/web/js/loader/load-tangelo.js)
configure_file(src/js/loader/load-tangelo.min.js.in ${CMAKE_BINARY_DIR}/Tangelo/web/js/loader/load-tangelo.min.js)

function(copy_file f outfile)
    add_custom_command(
        OUTPUT ${outfile}
        COMMAND ${CMAKE_COMMAND} -E copy_if_different ${CMAKE_SOURCE_DIR}/${f} ${outfile}
        DEPENDS ${f}
        COMMENT "Copying ${f}"
    )
    set_property(
        GLOBAL
        APPEND
        PROPERTY copied_files ${outfile}
    )
endfunction()

# Copy package files to build directory.
foreach(m ${TANGELO_SOURCES})
    copy_file(${m} ${CMAKE_BINARY_DIR}/${m})
endforeach()

# Also copy the README file.
copy_file(README.rst ${CMAKE_BINARY_DIR}/Tangelo/README)

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

set(MIN_JS_FILE ${CMAKE_BINARY_DIR}/Tangelo/web/js/tangelo.min.js)
set(JS_FILE ${CMAKE_BINARY_DIR}/Tangelo/web/js/tangelo.js)

add_custom_command(
    OUTPUT ${MIN_JS_FILE}
    COMMAND ${CMAKE_COMMAND} -E make_directory ${CMAKE_BINARY_DIR}/Tangelo/web/js
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
        COMMAND ${Sphinx_EXECUTABLE} -b html ${CMAKE_SOURCE_DIR}/docs ${CMAKE_BINARY_DIR}/Tangelo/docs
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
