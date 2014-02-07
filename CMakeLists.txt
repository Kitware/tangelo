cmake_minimum_required(VERSION 2.8)

# This project doesn't require any of the standard compilers, hence the "NONE"
# argument.
project(Tangelo NONE)

mark_as_advanced(CMAKE_INSTALL_PREFIX)

# Extend cmake module path.
list(APPEND CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/cmake")

# Include utility functions.
include(tangelo)

# Cache variables.
#
# Whether to build Tangelo at all, and then if yes, whether to build the Python
# package.
#
# This option is marked as advanced, as it only applies in a particular set of
# circumstances that apply mainly to Tangelo developers.
set(BUILD_TANGELO ON CACHE BOOL "Build Tangelo")
mark_as_advanced(BUILD_TANGELO)
if(${BUILD_TANGELO})
    set(BUILD_TANGELO_PYTHON_PACKAGE ON CACHE BOOL "Generate a Python package for Tangelo")
    mark_as_advanced(CLEAR BUILD_TANGELO_PYTHON_PACKAGE)
    mark_as_advanced(CLEAR UglifyJS_EXECUTABLE)
else()
    mark_as_advanced(FORCE BUILD_TANGELO_PYTHON_PACKAGE)
    mark_as_advanced(FORCE UglifyJS_EXECUTABLE)
endif()

# Whether to build Sphinx documentation.
set(BUILD_DOCUMENTATION OFF CACHE BOOL "Generate documentation for project.")
if(${BUILD_DOCUMENTATION})
    mark_as_advanced(CLEAR Sphinx_EXECUTABLE)
else()
    mark_as_advanced(FORCE Sphinx_EXECUTABLE)
endif()

# Show/hide testing options depending on whether testing is enabled.
if(${BUILD_TESTING})
    set(JS_STYLE_TESTS ON CACHE BOOL "Generate style tests for JS source files (via JSLint).")
    mark_as_advanced(CLEAR JS_STYLE_TESTS)
    if(${JS_STYLE_TESTS})
        mark_as_advanced(CLEAR JSLint_EXECUTABLE)
    else()
        mark_as_advanced(FORCE JSLint_EXECUTABLE)
    endif()

    set(PY_STYLE_TESTS ON CACHE BOOL "Generate style tests for Python source files (via pep8).")
    mark_as_advanced(CLEAR PY_STYLE_TESTS)
    if(${PY_STYLE_TESTS})
        mark_as_advanced(CLEAR Pep8_EXECUTABLE)
    else()
        mark_as_advanced(FORCE Pep8_EXECUTABLE)
    endif()

    set(JS_UNIT_TESTS ON CACHE BOOL "Generate tangelo.js unit tests.")
    mark_as_advanced(CLEAR JS_UNIT_TESTS)

    set(PY_UNIT_TESTS ON CACHE BOOL "Generate tangelo Python module unit tests.")
    mark_as_advanced(CLEAR PY_STYLE_TESTS)

    set(WEB_CONTENT_TESTS ON CACHE BOOL "Generate tests for example web appplications.")
    mark_as_advanced(CLEAR WEB_CONTENT_TESTS)

    if(${JS_UNIT_TESTS} OR ${WEB_CONTENT_TESTS})
        mark_as_advanced(CLEAR PhantomJS_EXECUTABLE)
    else()
        mark_as_advanced(FORCE PhantomJS_EXECUTABLE)
    endif()
else()
    mark_as_advanced(FORCE JS_STYLE_TESTS)
    mark_as_advanced(FORCE JSLint_EXECUTABLE)
    mark_as_advanced(FORCE PY_STYLE_TESTS)
    mark_as_advanced(FORCE Pep8_EXECUTABLE)
    mark_as_advanced(FORCE JS_UNIT_TESTS)
    mark_as_advanced(FORCE PhantomJS_EXECUTABLE)
    mark_as_advanced(FORCE PY_UNIT_TESTS)
    mark_as_advanced(FORCE WEB_CONTENT_TESTS)
endif()

# We will need the Python interpreter to build the package and run the tests.
find_package(PythonInterp 2.7 REQUIRED)

# Create a binary directory to hold various timestamps.
file(MAKE_DIRECTORY ${CMAKE_BINARY_DIR}/stamps)

# These files should be validated with JSLint.
set(JS_LINT_FILES
    ${CMAKE_SOURCE_DIR}/src/js/core/core.js
    ${CMAKE_SOURCE_DIR}/src/js/core/util.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/controlPanel.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/GoogleMapSVG.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/svgColorLegend.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/dendrogram.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/geodots.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/geonodelink.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/mapdots.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/nodelink.js
    ${CMAKE_SOURCE_DIR}/src/js/stream/_package.js
    ${CMAKE_SOURCE_DIR}/src/js/stream/stream.js
    ${CMAKE_SOURCE_DIR}/src/js/vtkweb/_package.js
    ${CMAKE_SOURCE_DIR}/src/js/vtkweb/vtkweb.js
    ${CMAKE_SOURCE_DIR}/src/js/widget/widget.js
    ${CMAKE_SOURCE_DIR}/tangelo/web/examples/index.js
    ${CMAKE_SOURCE_DIR}/tangelo/web/examples/landingPage.js
    ${CMAKE_SOURCE_DIR}/tangelo/web/examples/app-template/myapp.js
    ${CMAKE_SOURCE_DIR}/tangelo/web/examples/charitynet/charitynet.js
    ${CMAKE_SOURCE_DIR}/tangelo/web/examples/enron/enron.js
    ${CMAKE_SOURCE_DIR}/tangelo/web/examples/enron-impala/enron-imp.js
    ${CMAKE_SOURCE_DIR}/tangelo/web/examples/enron-titan/enron-titan.js
    ${CMAKE_SOURCE_DIR}/tangelo/web/examples/flickr/flickr.js
    ${CMAKE_SOURCE_DIR}/tangelo/web/examples/ner/ner.js
    ${CMAKE_SOURCE_DIR}/tangelo/web/examples/options/options.js
    ${CMAKE_SOURCE_DIR}/tangelo/web/examples/primes/primes.js
    ${CMAKE_SOURCE_DIR}/tangelo/web/examples/vegabuilder/vegabuilder.js
)

# These files should be uglified and concatenated.
set(JS_UGLIFY_FILES
    ${CMAKE_SOURCE_DIR}/src/js/core/core.js
    ${CMAKE_SOURCE_DIR}/src/js/core/util.js
    ${CMAKE_SOURCE_DIR}/src/js/widget/widget.js
    ${CMAKE_SOURCE_DIR}/src/js/vega/_package.js
    ${CMAKE_SOURCE_DIR}/src/js/vega/geovis.js
    ${CMAKE_SOURCE_DIR}/src/js/vtkweb/_package.js
    ${CMAKE_SOURCE_DIR}/src/js/vtkweb/vtkweb.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/controlPanel.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/GoogleMapSVG.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/svgColorLegend.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/dendrogram.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/geodots.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/geonodelink.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/mapdots.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/nodelink.js
    ${CMAKE_SOURCE_DIR}/src/js/stream/_package.js
    ${CMAKE_SOURCE_DIR}/src/js/stream/stream.js
    ${CMAKE_SOURCE_DIR}/src/js/data/_package.js
    ${CMAKE_SOURCE_DIR}/src/js/data/tree.js
)

# These files should be copied to the build directory.
glob_recurse_ungit(TANGELO_SOURCES tangelo/*)

if(${BUILD_TANGELO})
    # Copy package files to build directory.
    foreach(m ${TANGELO_SOURCES})
        set(outfile ${CMAKE_BINARY_DIR}/${m})
        copy_file(${m} ${outfile})
        list(APPEND TANGELO_BUILD_FILES ${outfile})
    endforeach()

    # Also copy the README file.
    copy_file(README.rst ${CMAKE_BINARY_DIR}/tangelo/README)

    # Uglify and concatenate the library js files.
    #
    # Set up options to create an unminified file.
    set(concatenator cat)
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

    set(MIN_JS_FILE ${CMAKE_BINARY_DIR}/tangelo/web/js/tangelo.min.js)
    set(JS_FILE ${CMAKE_BINARY_DIR}/tangelo/web/js/tangelo.js)

    add_custom_command(
        OUTPUT ${MIN_JS_FILE}
        COMMAND ${CMAKE_COMMAND} -E make_directory ${CMAKE_BINARY_DIR}/tangelo/web/js
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
endif()

# Generate documentation.
if(${BUILD_DOCUMENTATION})
    # Find Sphinx
    find_package(Sphinx REQUIRED)

    # A signal file to indicate the last time the documentation was built.
    set(DOCUMENTATION_STAMP ${CMAKE_BINARY_DIR}/stamps/documentation)

    set(DOCUMENTATION_SOURCES
        ${CMAKE_SOURCE_DIR}/docs/advanced-usage.rst
        ${CMAKE_SOURCE_DIR}/docs/architecture.rst
        ${CMAKE_SOURCE_DIR}/docs/basic-usage.rst
        ${CMAKE_SOURCE_DIR}/docs/building-an-app.rst
        ${CMAKE_SOURCE_DIR}/docs/coding-style-guide.rst
        ${CMAKE_SOURCE_DIR}/docs/developing-visualizations.rst
        ${CMAKE_SOURCE_DIR}/docs/index.rst
        ${CMAKE_SOURCE_DIR}/docs/installation.rst
        ${CMAKE_SOURCE_DIR}/docs/python-services.rst
        ${CMAKE_SOURCE_DIR}/docs/tangelo-js.rst
        ${CMAKE_SOURCE_DIR}/docs/tangelo-manpage.rst
        ${CMAKE_SOURCE_DIR}/docs/tangelo-passwd-manpage.rst
        ${CMAKE_SOURCE_DIR}/docs/tangelo-py.rst
        ${CMAKE_SOURCE_DIR}/docs/setup.rst
        ${CMAKE_SOURCE_DIR}/docs/static/tangelo-sphinx.css
        ${CMAKE_SOURCE_DIR}/docs/templates/layout.html
    )

    set(DOCUMENTATION_CONTROL_FILE
        ${CMAKE_SOURCE_DIR}/docs/conf.py
    )

    # A command to generate the documentation.
    add_custom_command(
        OUTPUT ${DOCUMENTATION_STAMP}
        COMMAND ${Sphinx_EXECUTABLE} -b html ${CMAKE_SOURCE_DIR}/docs ${CMAKE_BINARY_DIR}/tangelo/web/docs && ${CMAKE_COMMAND} -E touch ${DOCUMENTATION_STAMP}
        DEPENDS ${DOCUMENTATION_SOURCES} ${DOCUMENTATION_CONTROL_FILE}
        COMMENT "Generating documentation"
    )
endif()

if(${BUILD_TANGELO} AND ${BUILD_TANGELO_PYTHON_PACKAGE})
    # A target to build the package.
    set(DIST_STAMP ${CMAKE_BINARY_DIR}/stamps/sdist)
    add_custom_command(
        OUTPUT ${DIST_STAMP}
        COMMAND ${PYTHON_EXECUTABLE} setup.py sdist --dist-dir ../sdist >../sdist.log && ${CMAKE_COMMAND} -E touch ${DIST_STAMP}
        DEPENDS ${TANGELO_BUILD_FILES}
        WORKING_DIRECTORY ${CMAKE_BINARY_DIR}/tangelo
        COMMENT "Generating Python package"
        )
endif()

# Testing
include(CTest)
enable_testing()

if(${BUILD_TESTING})
    # A list of Javascript unit tests - list the base of the filename here.  The
    # corresponding .js file should appear in testing/js-unit-tests/.
    set(JS_UNIT_TEST_CASES
        tangelo-exists
        isFunction
        isBoolean
    )

    # A list of Tangelo (i.e. Python) unit tests.  The corresponding .py file
    # should appear in testing/py-unit-tests/.
    set(PY_UNIT_TEST_CASES
        get_free_port
    )

    # A list of "web content tests" - that is, these tests will generally
    # speaking, retrieve content from a URL, then run a function on the content
    # to determine whether the test passes.  This may be as simple as comparing
    # the content directly against expected output.
    set(WEB_CONTENT_TEST_CASES
        echo-service-no-args
        echo-service
        rest-implicit-get
        rest-get
        rest-post
        ner-service
        404-not-found
        200-ok
        geodots-match
    )

    set(TESTING_SOURCES
        testing/vtkweb/vtkwebtest.py
        testing/vtkweb/baseline-cone.png
        testing/vtkweb/baseline-phylotree.png
        testing/vtkweb/tangelo-vtkweb-test.py
    )

    foreach(f ${TESTING_SOURCES})
        configure_file(${f} ${f} COPYONLY)
    endforeach()

    # VTKWeb test.
    add_test(
        NAME vtkwebcone
        WORKING_DIRECTORY ${CMAKE_BINARY_DIR}/testing/vtkweb
        COMMAND /home/roni/work/VTK/build-osmesa/bin/vtkpython vtkweb-cone-test.py
    )

    # Javascript style tests.
    if(${JS_STYLE_TESTS})
        # Find JSLint.
        find_package(JSLint REQUIRED)

        # Generate the tests.
        foreach(f ${JS_LINT_FILES})
            add_test(jslint:${f} ${JSLint_EXECUTABLE} ${f})
        endforeach()
    endif()

    # Python style tests.
    if(${PY_STYLE_TESTS})
        # Find pep8.
        find_package(Pep8 REQUIRED)

        # Generate the tests.
        foreach(f ${PY_LINT_FILES})
            add_test(pep8:${f} ${Pep8_EXECUTABLE} ${f})
        endforeach()
    endif()

    # Unit tests for tangelo.js.
    if(${JS_UNIT_TESTS})
        # Find PhantomJS.
        find_package(PhantomJS REQUIRED)

        # Generate the tests.
        foreach(f ${JS_UNIT_TEST_CASES})
            set(js ${CMAKE_SOURCE_DIR}/testing/js-unit-tests/${f}.js)
            set(html ${CMAKE_BINARY_DIR}/tangelo/web/tests/js-unit-tests/${f}.html)

            # Generate the testing HTML file (to be run with phantomjs via a
            # jasmine runner) via a custom command, so the file is regenerated
            # when the source file changes.
            add_custom_command(OUTPUT ${html}
                COMMAND ${CMAKE_COMMAND} -DTEST_NAME="${f}" -P ${CMAKE_SOURCE_DIR}/cmake/configure-js-unit-test.cmake
                COMMAND ${CMAKE_COMMAND} -E touch ${html}
                DEPENDS ${js} ${CMAKE_SOURCE_DIR}/testing/phantomjs/jasmine-scaffold.html.in
                COMMENT "Generating Javascript unit test ${f}"
            )

            list(APPEND JS_UNIT_TEST_FILES ${html})

            add_test(js-unit-test:${f}
                ${PhantomJS_EXECUTABLE} ${CMAKE_SOURCE_DIR}/testing/phantomjs/run-jasmine.js http://localhost:8080/tests/js-unit-tests/${f}.html
            )
        endforeach()

        # Copy the blanket JS files to where they need to be.
        configure_file(${CMAKE_SOURCE_DIR}/testing/phantomjs/blanket.min.js tangelo/web/tests/js-unit-tests/blanket.min.js COPYONLY)
        configure_file(${CMAKE_SOURCE_DIR}/testing/phantomjs/jasmine-blanket.js tangelo/web/tests/js-unit-tests/jasmine-blanket.js COPYONLY)

        # Generate the coverage test.
        set(coverage_test ${CMAKE_BINARY_DIR}/tangelo/web/tests/js-unit-tests/tangelojs-coverage.html)
        set(coverage_configurator  ${CMAKE_SOURCE_DIR}/cmake/configure-js-coverage-test.cmake)
        add_custom_command(OUTPUT ${coverage_test}
            COMMAND ${CMAKE_COMMAND} "-DJS_UNIT_TEST_CASES=\"${JS_UNIT_TEST_CASES}\"" -P ${coverage_configurator}
            COMMAND ${CMAKE_COMMAND} -E touch ${coverage_test}
            DEPENDS ${JS_UNIT_TEST_FILES} ${CMAKE_SOURCE_DIR}/testing/phantomjs/coverage-scaffold.html.in ${coverage_configurator}
            COMMENT "Generating tangelo.js coverage test"
        )

        list(APPEND JS_UNIT_TEST_FILES ${coverage_test})
    endif()

    # Unit tests for tangelo Python module.
    if(${PY_UNIT_TESTS})
        # Add each test.
        foreach(f ${PY_UNIT_TEST_CASES})
            add_test(py-unit-test:${f}
                ${PYTHON_EXECUTABLE} ${CMAKE_SOURCE_DIR}/testing/py-unit-tests/${f}.py
            )
        endforeach()
    endif()

    # Web content tests.
    if(${WEB_CONTENT_TESTS})
        # Find PhantomJS.
        find_package(PhantomJS REQUIRED)

        # Generate the tests.
        foreach(f ${WEB_CONTENT_TEST_CASES})
            set(js ${CMAKE_SOURCE_DIR}/testing/web-content-tests/${f}.js)
            set(js_out ${CMAKE_BINARY_DIR}/tangelo/web/tests/web-content-tests/${f}.js)

            add_custom_command(OUTPUT ${js_out}
                COMMAND ${CMAKE_COMMAND} -DTEST_NAME="${f}" -P ${CMAKE_SOURCE_DIR}/cmake/configure-web-content-test.cmake
                COMMAND ${CMAKE_COMMAND} -E touch ${js_out}
                DEPENDS ${js} ${CMAKE_SOURCE_DIR}/testing/phantomjs/web-content-test-scaffold.js.in
                COMMENT "Generating web content test ${f}"
            )

            list(APPEND WEB_CONTENT_TEST_FILES ${js_out})

            add_test(web-content-test:${f}
                ${PhantomJS_EXECUTABLE} ${js_out}
            )
        endforeach()
    endif()
endif()

# The top-level target.
get_property(ALL_COPIED_FILES GLOBAL PROPERTY copied_files)
add_custom_target(
    tangelo-all
    ALL
    DEPENDS ${ALL_COPIED_FILES}
            ${EXAMPLES_SYMLINK}
            ${MIN_JS_FILE}
            ${JS_FILE}
            ${DOCUMENTATION_STAMP}
            ${DIST_STAMP}
            ${JS_UNIT_TEST_FILES}
            ${WEB_CONTENT_TEST_FILES}
)
