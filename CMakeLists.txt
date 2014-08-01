cmake_minimum_required(VERSION 2.8)

# This project doesn't require any of the standard compilers, hence the "NONE"
# argument.
project(Tangelo NONE)
set(TANGELO_VERSION 0.7dev)

mark_as_advanced(CMAKE_INSTALL_PREFIX)

# We will need the Python interpreter to build the package and run the tests.
find_package(PythonInterp 2.7 REQUIRED)

# Include the testing module; activate testing by default.
set(COVERAGE_COMMAND "${CMAKE_BINARY_DIR}/cover2gcov.py")
set(COVERAGE_EXTRA_FLAGS "")
enable_testing()
include(CTest)

# Extend cmake module path.
list(APPEND CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/cmake")

# Utility functions.
#
# Copy a file at build time.  The "copied_files" property contains the full list
# of such files, so it can be added to the top-level target to ensure they
# actually get copied.
function(copy_file f outfile)
    add_custom_command(
        OUTPUT ${outfile}
        COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_SOURCE_DIR}/${f} ${outfile}
        DEPENDS ${f}
        COMMENT "Copying ${f}"
    )
    set_property(
        GLOBAL
        APPEND
        PROPERTY copied_files ${outfile}
    )
endfunction()

# Collect all files in a specified directory, recursively, excluding files under
# .git and files beginning with a dot.
function(glob_recurse_ungit var path)
    file(GLOB_RECURSE all_files RELATIVE ${CMAKE_SOURCE_DIR} ${path})
    foreach(f ${all_files})
        string(FIND ${f} ".git" index)
        if(${index} EQUAL -1)
            string(FIND ${f} "/." index)
        endif()
        if(${index} EQUAL -1)
            list(APPEND files ${f})
        endif()
    endforeach()

    set(${var} ${files} PARENT_SCOPE)
endfunction()

# Cache variables.
#
# Whether to build Tangelo at all, and then if yes, whether to build the Python
# package.
#
# These options are marked as advanced, as they only apply in a particular set
# of circumstances that apply mainly to Tangelo developers.
set(BUILD_TANGELO ON CACHE BOOL "Build Tangelo")
mark_as_advanced(BUILD_TANGELO)

set(BUILD_TANGELO_PYTHON_PACKAGE ON CACHE BOOL "Generate a Python package for Tangelo")
mark_as_advanced(BUILD_TANGELO_PYTHON_PACKAGE)

# Whether to build Sphinx documentation.
set(BUILD_DOCUMENTATION ON CACHE BOOL "Generate documentation for project.")

# We will need Sphinx (for documentation), or the virtual environment in general
# (for testing).
if(${BUILD_DOCUMENTATION} OR ${BUILD_TESTING})
    find_program(VIRTUALENV_EXECUTABLE
        NAMES virtualenv virtualenv2
    )

    # This initializes the virtual environment.
    set(VENV_DIR ${CMAKE_BINARY_DIR}/venv)
    set(VENV_PYTHON_EXECUTABLE ${VENV_DIR}/bin/python)
    set(PIP_EXECUTABLE ${VENV_DIR}/bin/pip)
    add_custom_command(
        OUTPUT ${VENV_PYTHON_EXECUTABLE}
               ${PIP_EXECUTABLE}
        COMMAND ${VIRTUALENV_EXECUTABLE} -p ${PYTHON_EXECUTABLE}
                                         ${CMAKE_BINARY_DIR}/venv
        COMMENT "Creating virtual Python environment"
    )

    # Install Sphinx (for documentation).
    set(SPHINX_EXECUTABLE ${VENV_DIR}/bin/sphinx-build)
    add_custom_command(
        OUTPUT ${SPHINX_EXECUTABLE}
        COMMAND ${PIP_EXECUTABLE} install --upgrade --force-reinstall Sphinx
        DEPENDS ${PIP_EXECUTABLE}
        COMMENT "Installing Sphinx"
    )

    # Install coverage (for Python coverage testing).
    set(COVERAGE_EXECUTABLE ${VENV_DIR}/bin/coverage)
    add_custom_command(
        OUTPUT ${COVERAGE_EXECUTABLE}
        COMMAND ${PIP_EXECUTABLE} install --upgrade --force-reinstall coverage
        DEPENDS ${PIP_EXECUTABLE}
        COMMENT "Installing coverage"
    )

    # Install pep8 (for Python style testing).
    set(PEP8_EXECUTABLE ${VENV_DIR}/bin/pep8)
    add_custom_command(
        OUTPUT ${PEP8_EXECUTABLE}
        COMMAND ${PIP_EXECUTABLE} install --upgrade --force-reinstall pep8
        DEPENDS ${PIP_EXECUTABLE}
        COMMENT "Installing pep8"
    )

    # Install pylint (for Python lint tests).
    set(PYLINT_EXECUTABLE ${VENV_DIR}/bin/pylint)
    add_custom_command(
        OUTPUT ${PYLINT_EXECUTABLE}
        COMMAND ${PIP_EXECUTABLE} install --upgrade --force-reinstall pylint
        DEPENDS ${PIP_EXECUTABLE}
        COMMENT "Installing pylint"
    )

    # Install pymongo (for use of Mongo in example applications).
    set(MONGO_MODULE ${VENV_DIR}/lib/python2.7/site-packages/pymongo/__init__.py)
    add_custom_command(
        OUTPUT ${MONGO_MODULE}
        COMMAND ${PIP_EXECUTABLE} install --upgrade --force-reinstall pymongo
        DEPENDS ${PIP_EXECUTABLE}
        COMMENT "Installing pymongo"
    )
    list(APPEND ${TESTING_DEPENDENCIES} ${MONGO_MODULE})
endif()

# Need UglifyJS to build Tangelo; JSLint and PhantomJS to test.
if(${BUILD_TANGELO} OR ${BUILD_TESTING})
    find_program(NPM_EXECUTABLE
        npm
    )

    set(NPM_DIR ${CMAKE_BINARY_DIR}/node_modules)

    # Install JSLint (for Javascript style/lint tests).
    set(JSLINT_EXECUTABLE ${NPM_DIR}/jslint/bin/jslint.js)
    add_custom_command(
        OUTPUT ${JSLINT_EXECUTABLE}
        COMMAND ${NPM_EXECUTABLE} install jslint
        COMMENT "Installing jslint"
    )

    # Install UglifyJS (to build Tangelo Javascript libraries).
    set(UGLIFYJS_EXECUTABLE ${NPM_DIR}/uglify-js/bin/uglifyjs)
    add_custom_command(
        OUTPUT ${UGLIFYJS_EXECUTABLE}
        COMMAND ${NPM_EXECUTABLE} install uglify-js
        COMMENT "Installing uglify-js"
    )

    # Install PhantomJS (for web content and Javascript unit tests).
    set(PHANTOMJS_EXECUTABLE ${NPM_DIR}/phantomjs/bin/phantomjs)
    add_custom_command(
        OUTPUT ${PHANTOMJS_EXECUTABLE}
        COMMAND ${NPM_EXECUTABLE} install phantomjs
        COMMENT "Installing phantomjs"
    )
endif()

# Show/hide testing options depending on whether testing is enabled.
if(${BUILD_TESTING})
    set(JS_LINT_TESTS ON CACHE BOOL "Generate style tests for JS source files (via JSLint).")
    set(PY_STYLE_TESTS ON CACHE BOOL "Generate style tests for Python source files (via pep8).")
    set(PY_LINT_TESTS OFF CACHE BOOL "Generate pylint tests for Python source files.")
    set(JS_UNIT_TESTS ON CACHE BOOL "Generate tangelo.js unit tests.")
    set(PY_UNIT_TESTS ON CACHE BOOL "Generate tangelo Python module unit tests.")
    set(WEB_CONTENT_TESTS ON CACHE BOOL "Generate tests for example web appplications.")
    set(PY_COVERAGE_TEST ON CACHE BOOL "Generate Python coverage report.")
    set(OTHER_TESTS ON CACHE BOOL "Generate miscellaenous other tests.")
    set(TESTING_HOST localhost CACHE STRING "The host to run Tangelo on for the test suite.")
    set(TESTING_PORT 50047 CACHE STRING "The port number to run Tangelo for the test suite.")

    mark_as_advanced(TESTING_HOST)

    mark_as_advanced(CLEAR JS_LINT_TESTS
                           PY_STYLE_TESTS
                           PY_LINT_TESTS
                           JS_UNIT_TESTS
                           PY_STYLE_TESTS
                           WEB_CONTENT_TESTS
                           PY_COVERAGE_TEST
                           TESTING_PORT
    )
else()
    mark_as_advanced(FORCE JS_LINT_TESTS
                           PY_STYLE_TESTS
                           PY_LINT_TESTS
                           JS_UNIT_TESTS
                           PY_UNIT_TESTS
                           WEB_CONTENT_TESTS
                           PY_COVERAGE_TEST
                           TESTING_PORT
    )
endif()

# Create a binary directory to hold various timestamps.
file(MAKE_DIRECTORY ${CMAKE_BINARY_DIR}/stamps)

# These files should be validated with JSLint.
#
# NOTE: flickr.js and ner.js have been commented out because they are not
# expected to pass JSLint validation without a major rewrite.
set(JS_LINT_FILES
    ${CMAKE_SOURCE_DIR}/src/js/core/core.js.in
    ${CMAKE_SOURCE_DIR}/src/js/core/util.js
    ${CMAKE_SOURCE_DIR}/src/js/data/_package.js
    ${CMAKE_SOURCE_DIR}/src/js/data/tree.js
    ${CMAKE_SOURCE_DIR}/src/js/data/distanceCluster.js
    ${CMAKE_SOURCE_DIR}/src/js/data/smooth.js
    ${CMAKE_SOURCE_DIR}/src/js/data/bin.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/GoogleMapSVG.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/controlPanel.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/dendrogram.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/geodots.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/geonodelink.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/girderBrowser.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/mapdots.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/nodelink.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/svgColorLegend.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/correlationPlot.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/timeline.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/geojsMap.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/geojsdots.js
    ${CMAKE_SOURCE_DIR}/src/js/stream/_package.js
    ${CMAKE_SOURCE_DIR}/src/js/stream/stream.js
    ${CMAKE_SOURCE_DIR}/src/js/vega/_package.js
    ${CMAKE_SOURCE_DIR}/src/js/vega/geovis.js
    ${CMAKE_SOURCE_DIR}/src/js/vtkweb/_package.js
    ${CMAKE_SOURCE_DIR}/src/js/vtkweb/vtkweb.js
    ${CMAKE_SOURCE_DIR}/src/js/widget/widget.js
    ${CMAKE_SOURCE_DIR}/www/examples/index.js
    ${CMAKE_SOURCE_DIR}/www/examples/landingPage.js
    ${CMAKE_SOURCE_DIR}/www/examples/app-template/myapp.js
    ${CMAKE_SOURCE_DIR}/www/examples/dendrogram/dendrogram.js
    ${CMAKE_SOURCE_DIR}/www/examples/enron/enron.js
    #${CMAKE_SOURCE_DIR}/www/examples/flickr/flickr.js
    ${CMAKE_SOURCE_DIR}/www/examples/geodots/geodots.js
    ${CMAKE_SOURCE_DIR}/www/examples/geonodelink/geonodelink.js
    ${CMAKE_SOURCE_DIR}/www/examples/mapdots/mapdots.js
    #${CMAKE_SOURCE_DIR}/www/examples/ner/ner.js
    ${CMAKE_SOURCE_DIR}/www/examples/primes/primes.js
    ${CMAKE_SOURCE_DIR}/www/examples/vegabuilder/vegabuilder.js
    ${CMAKE_SOURCE_DIR}/www/examples/vtkweb/index.js
    ${CMAKE_SOURCE_DIR}/testing/phantomjs/blanket-test.js
    ${CMAKE_SOURCE_DIR}/testing/phantomjs/run-jasmine.js
    ${CMAKE_SOURCE_DIR}/testing/test-cases/js-unit-tests/isBoolean.js
    ${CMAKE_SOURCE_DIR}/testing/test-cases/js-unit-tests/isFunction.js
    ${CMAKE_SOURCE_DIR}/testing/test-cases/js-unit-tests/tangelo-exists.js
    ${CMAKE_SOURCE_DIR}/testing/test-cases/web-content-tests/200-ok.js
    ${CMAKE_SOURCE_DIR}/testing/test-cases/web-content-tests/404-not-found.js
    ${CMAKE_SOURCE_DIR}/testing/test-cases/web-content-tests/echo-service-no-args.js
    ${CMAKE_SOURCE_DIR}/testing/test-cases/web-content-tests/echo-service.js
    ${CMAKE_SOURCE_DIR}/testing/test-cases/web-content-tests/geodots-match.js
    ${CMAKE_SOURCE_DIR}/testing/test-cases/web-content-tests/ner-service.js
    ${CMAKE_SOURCE_DIR}/testing/test-cases/web-content-tests/primes.js
    ${CMAKE_SOURCE_DIR}/testing/test-cases/web-content-tests/rest-get.js
    ${CMAKE_SOURCE_DIR}/testing/test-cases/web-content-tests/rest-implicit-get.js
    ${CMAKE_SOURCE_DIR}/testing/test-cases/web-content-tests/rest-post.js
)

# These files should be validated with pep8.
set(PEP8_FILES
    ${CMAKE_SOURCE_DIR}/scripts/tangelo.in
    ${CMAKE_SOURCE_DIR}/scripts/vtkweb-launcher.py
    ${CMAKE_SOURCE_DIR}/scripts/setup.py.in
    ${CMAKE_SOURCE_DIR}/tangelo/__init__.py
    ${CMAKE_SOURCE_DIR}/tangelo/plugin.py
    ${CMAKE_SOURCE_DIR}/tangelo/server.py
    ${CMAKE_SOURCE_DIR}/tangelo/stream.py
    ${CMAKE_SOURCE_DIR}/tangelo/tool.py
    ${CMAKE_SOURCE_DIR}/tangelo/util.py
    ${CMAKE_SOURCE_DIR}/tangelo/vtkweb.py
    ${CMAKE_SOURCE_DIR}/tangelo/websocket.py
    ${CMAKE_SOURCE_DIR}/www/examples/app-template/myservice.py
    ${CMAKE_SOURCE_DIR}/www/examples/enron/emailers.py
    ${CMAKE_SOURCE_DIR}/www/examples/ner/ner.py
    ${CMAKE_SOURCE_DIR}/www/examples/ner/nermongo.py
    ${CMAKE_SOURCE_DIR}/www/examples/primes/primes.py
    ${CMAKE_SOURCE_DIR}/www/service/celery.py
    ${CMAKE_SOURCE_DIR}/www/service/config.py
    ${CMAKE_SOURCE_DIR}/www/service/impala-json.py
    ${CMAKE_SOURCE_DIR}/www/service/mongo.py
    ${CMAKE_SOURCE_DIR}/www/service/svg2pdf.py
    ${CMAKE_SOURCE_DIR}/www/service/test/404.py
    ${CMAKE_SOURCE_DIR}/www/service/test/abspath.py
    ${CMAKE_SOURCE_DIR}/www/service/test/broken.py
    ${CMAKE_SOURCE_DIR}/www/service/test/echo.py
    ${CMAKE_SOURCE_DIR}/www/service/test/exceptional.py
    ${CMAKE_SOURCE_DIR}/www/service/test/restful.py
    ${CMAKE_SOURCE_DIR}/www/service/test/testapp.py
    ${CMAKE_SOURCE_DIR}/testing/test-cases/py-unit-tests/get_free_port.py
    ${CMAKE_SOURCE_DIR}/testing/test-cases/py-unit-tests/tangelo-types.py
)

# These files should be uglified and concatenated.
configure_file(src/js/core/core.js.in ${CMAKE_BINARY_DIR}/core.js)
set(JS_UGLIFY_FILES
    ${CMAKE_BINARY_DIR}/core.js
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
    ${CMAKE_SOURCE_DIR}/src/js/plugin/girderBrowser.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/mapdots.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/nodelink.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/correlationPlot.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/timeline.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/geojsMap.js
    ${CMAKE_SOURCE_DIR}/src/js/plugin/geojsdots.js
    ${CMAKE_SOURCE_DIR}/src/js/stream/_package.js
    ${CMAKE_SOURCE_DIR}/src/js/stream/stream.js
    ${CMAKE_SOURCE_DIR}/src/js/data/_package.js
    ${CMAKE_SOURCE_DIR}/src/js/data/tree.js
    ${CMAKE_SOURCE_DIR}/src/js/data/distanceCluster.js
    ${CMAKE_SOURCE_DIR}/src/js/data/smooth.js
    ${CMAKE_SOURCE_DIR}/src/js/data/bin.js
)

# These files should be copied to the build directory.
glob_recurse_ungit(TANGELO_WEB_SOURCES www/*)
glob_recurse_ungit(TANGELO_MODULE_SOURCES tangelo/*)
set(TANGELO_SOURCES
    ${TANGELO_WEB_SOURCES}
    ${TANGELO_MODULE_SOURCES}
    scripts/tangelo-passwd
    scripts/vtkweb-launcher.py
    assets/conf/tangelo.conf.global
    assets/conf/tangelo.conf.local
    assets/data/get-flickr-data.py
    assets/images/tangelo.ico
)

# Configure setup.py
configure_file(scripts/setup.py.in ${CMAKE_BINARY_DIR}/tangelo/setup.py)
configure_file(scripts/tangelo.in ${CMAKE_BINARY_DIR}/tangelo/scripts/tangelo)

if(${BUILD_TANGELO})
    # Copy package files to build directory.
    foreach(m ${TANGELO_SOURCES})
        set(outfile ${CMAKE_BINARY_DIR}/tangelo/${m})
        copy_file(${m} ${outfile})
        list(APPEND TANGELO_BUILD_FILES ${outfile})
    endforeach()

    list(APPEND TANGELO_BUILD_FILES
        ${CMAKE_BINARY_DIR}/tangelo/scripts/tangelo
        ${CMAKE_BINARY_DIR}/tangelo/setup.py
    )

    # Also copy the README file.
    copy_file(README.rst ${CMAKE_BINARY_DIR}/tangelo/README)

    # Build the Tangelo javascript libraries.
    set(MIN_JS_FILE ${CMAKE_BINARY_DIR}/tangelo/www/js/tangelo.min.js)
    set(JS_FILE ${CMAKE_BINARY_DIR}/tangelo/www/js/tangelo.js)

    # Minified .js file.
    add_custom_command(
        OUTPUT ${MIN_JS_FILE}
        COMMAND ${CMAKE_COMMAND} -E make_directory ${CMAKE_BINARY_DIR}/tangelo/www/js
        COMMAND ${UGLIFYJS_EXECUTABLE} ${JS_UGLIFY_FILES} -m -o ${MIN_JS_FILE}
        DEPENDS ${JS_UGLIFY_FILES} ${UGLIFYJS_EXECUTABLE}
        COMMENT "Creating minified javascript library"
    )

    # Unminified .js file.
    add_custom_command(
        OUTPUT ${JS_FILE}
        COMMAND ${UGLIFYJS_EXECUTABLE} ${JS_UGLIFY_FILES} -b -o ${JS_FILE}
        DEPENDS ${JS_UGLIFY_FILES} ${UGLIFYJS_EXECUTABLE}
        COMMENT "Creating unminified javascript library"
    )
endif()

# Generate documentation.
if(${BUILD_DOCUMENTATION})
    set(DOCUMENTATION_SOURCES
        ${CMAKE_SOURCE_DIR}/docs/advanced-usage.rst
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
        ${CMAKE_SOURCE_DIR}/docs/testing.rst
        ${CMAKE_SOURCE_DIR}/docs/setup.rst
        ${CMAKE_SOURCE_DIR}/docs/static/tangelo-sphinx.css
        ${CMAKE_SOURCE_DIR}/docs/templates/layout.html
    )

    set(DOCUMENTATION_CONTROL_FILE
        ${CMAKE_SOURCE_DIR}/docs/conf.py
    )

    # A command to generate the documentation.
    set(DOCUMENTATION_DIR ${CMAKE_BINARY_DIR}/tangelo/www/docs)
    set(DOCUMENTATION_INDEX ${DOCUMENTATION_DIR}/index.html)
    add_custom_command(
        OUTPUT ${DOCUMENTATION_INDEX}
        COMMAND ${SPHINX_EXECUTABLE} -b html
                                     -D version="${TANGELO_VERSION}"
                                     -D release="${TANGELO_VERSION}"
                                     ${CMAKE_SOURCE_DIR}/docs ${DOCUMENTATION_DIR}
        COMMAND ${CMAKE_COMMAND} -E touch ${DOCUMENTATION_INDEX}
        DEPENDS ${DOCUMENTATION_SOURCES} ${DOCUMENTATION_CONTROL_FILE} ${SPHINX_EXECUTABLE}
        COMMENT "Generating documentation"
    )

    set(DOCUMENTATION_DEPENDENCIES ${DOCUMENTATION_INDEX})
endif()

if(${BUILD_TANGELO} AND ${BUILD_TANGELO_PYTHON_PACKAGE})
    # A target to build the package.
    set(TANGELO_PACKAGE ${CMAKE_BINARY_DIR}/sdist/tangelo-${TANGELO_VERSION}.tar.gz)
    add_custom_command(
        OUTPUT ${TANGELO_PACKAGE}
        COMMAND ${PYTHON_EXECUTABLE} setup.py sdist --dist-dir ../sdist >../sdist.log
        DEPENDS ${TANGELO_BUILD_FILES}
        WORKING_DIRECTORY ${CMAKE_BINARY_DIR}/tangelo
        COMMENT "Creating Tangelo Python package"
    )
endif()

# Testing
if(${BUILD_TESTING})
    # Grab the test filenames from the directory.
    file(GLOB JS_UNIT_TEST_CASES
        ${CMAKE_SOURCE_DIR}/testing/test-cases/js-unit-tests/*.js
    )

    # Add any configured test files here.
    configure_file(
        testing/test-cases/js-unit-tests/tangelo-version.js.in
        ${CMAKE_BINARY_DIR}/test-cases/js-unit-tests/tangelo-version.js
    )
    list(APPEND JS_UNIT_TEST_CASES
        ${CMAKE_BINARY_DIR}/test-cases/js-unit-tests/tangelo-version.js
    )

    # Grab the test filenames from the Python unit test directory.
    file(GLOB PY_UNIT_TEST_CASES
        ${CMAKE_SOURCE_DIR}/testing/test-cases/py-unit-tests/*.py
    )

    # Grab the list of "web content tests" - that is, these tests will generally
    # speaking, retrieve content from a URL, then run a function on the content
    # to determine whether the test passes.  This may be as simple as comparing
    # the content directly against expected output.
    file(GLOB WEB_CONTENT_TEST_CASES
        ${CMAKE_SOURCE_DIR}/testing/test-cases/web-content-tests/*.js
    )

    # Configure the python test runner.
    configure_file(testing/test-runners/tangelo-test-runner.py.in ${CMAKE_BINARY_DIR}/test-runners/tangelo-test-runner.py)

    # Install Tangelo in the virtual environment.
    set(TANGELO_EXECUTABLE ${VENV_DIR}/bin/tangelo)
    add_custom_command(
        OUTPUT ${TANGELO_EXECUTABLE}
        COMMAND ${PIP_EXECUTABLE} install --upgrade ${TANGELO_PACKAGE}
        DEPENDS ${PIP_EXECUTABLE} ${TANGELO_PACKAGE}
        COMMENT "Installing Tangelo"
    )

    # These will be added to the dependencies of the top-level target.
    list(APPEND TESTING_DEPENDENCIES ${TANGELO_EXECUTABLE})

    # Javascript style tests.
    if(${JS_LINT_TESTS})
        # Generate the tests.
        foreach(f ${JS_LINT_FILES})
            add_test(style:js:${f} ${JSLINT_EXECUTABLE} ${f})
        endforeach()

        # Make sure JSLint is installed.
        list(APPEND TESTING_DEPENDENCIES ${JSLINT_EXECUTABLE})
    endif()

    # Python style tests.
    if(${PY_STYLE_TESTS})
        foreach(f ${PEP8_FILES})
            add_test(style:py:pep8:${f} ${PEP8_EXECUTABLE} --ignore=E501 ${f})
        endforeach()

        # Make sure pep8 is installed.
        list(APPEND TESTING_DEPENDENCIES ${PEP8_EXECUTABLE})
    endif()

    # Python lint tests.
    if(PY_LINT_TESTS)
        set(PYLINT_RCFILE "${CMAKE_SOURCE_DIR}/testing/pylint/pylintrc")
        set(PYLINT_OPTIONS --rcfile=${PYLINT_RCFILE})

        foreach(f ${PEP8_FILES})
            add_test(
                NAME style:py:pylint:${f}
                COMMAND ${PYLINT_EXECUTABLE} ${PYLINT_OPTIONS} ${f}
                )
        endforeach()

        # Make sure pylint is installed.
        list(APPEND TESTING_DEPENDENCIES ${PYLINT_EXECUTABLE})
    endif()

    # A variation of add_test that invokes setup and teardown around the
    # requested command.
    function(add_tangelo_test test_name)
        add_test(
            NAME ${test_name}
            COMMAND ${VENV_PYTHON_EXECUTABLE}
                    ${CMAKE_BINARY_DIR}/test-runners/tangelo-test-runner.py
                    ${ARGN}
        )
        set_property(TEST ${test_name} PROPERTY RESOURCE_LOCK tangelo)
    endfunction()

    # Unit tests for tangelo.js.
    if(${JS_UNIT_TESTS})
        # Make sure PhantomJS is installed.
        list(APPEND TESTING_DEPENDENCIES ${PHANTOMJS_EXECUTABLE})

        # Generate the tests.
        foreach(js ${JS_UNIT_TEST_CASES})
            get_filename_component(f "${js}" NAME_WE)
            set(html ${CMAKE_BINARY_DIR}/tangelo/www/tests/js-unit-tests/${f}.html)

            # Generate the testing HTML file (to be run with phantomjs via a
            # jasmine runner) via a custom command, so the file is regenerated
            # when the source file changes.
            add_custom_command(OUTPUT ${html}
                COMMAND ${CMAKE_COMMAND} -DTEST_NAME="${f}"
                                         -DSOURCE_DIR="${CMAKE_SOURCE_DIR}"
                                         -DSOURCE_FILE="${js}"
                                         -P ${CMAKE_SOURCE_DIR}/cmake/configure-js-unit-test.cmake
                COMMAND ${CMAKE_COMMAND} -E touch ${html}
                DEPENDS ${js} ${CMAKE_SOURCE_DIR}/testing/test-runners/jasmine-runner.html.in
                COMMENT "Generating Javascript unit test ${f}"
            )

            list(APPEND JS_UNIT_TEST_FILES ${html})

            add_tangelo_test(unit-test:js:${f}
                ${PHANTOMJS_EXECUTABLE} ${CMAKE_SOURCE_DIR}/testing/phantomjs/run-jasmine.js
                                            http://${TESTING_HOST}:${TESTING_PORT}/tests/js-unit-tests/${f}.html
            )
        endforeach()

        # Copy the blanket JS files to where they need to be.
        configure_file(${CMAKE_SOURCE_DIR}/testing/js/blanket.min.js tangelo/www/tests/js-coverage/blanket.min.js COPYONLY)
        configure_file(${CMAKE_SOURCE_DIR}/testing/js/jasmine-blanket.js tangelo/www/tests/js-coverage/jasmine-blanket.js COPYONLY)

        # Generate the coverage report.
        set(coverage_test ${CMAKE_BINARY_DIR}/tangelo/www/tests/js-coverage/tangelojs-coverage.html)
        set(coverage_configurator  ${CMAKE_SOURCE_DIR}/cmake/configure-js-coverage-test.cmake)
        add_custom_command(OUTPUT ${coverage_test}
            COMMAND ${CMAKE_COMMAND} "-DJS_UNIT_TEST_CASES=\"${JS_UNIT_TEST_CASES}\""
                                     -DSOURCE_DIR="${CMAKE_SOURCE_DIR}"
                                     -P ${coverage_configurator}
            COMMAND ${CMAKE_COMMAND} -E touch ${coverage_test}
            DEPENDS ${JS_UNIT_TEST_FILES} ${CMAKE_SOURCE_DIR}/testing/test-runners/coverage-runner.html.in ${coverage_configurator}
            COMMENT "Generating tangelo.js coverage report"
        )

        list(APPEND JS_UNIT_TEST_FILES ${coverage_test})
    endif()

    # Configure the gcov impersonator script.
    configure_file(
        testing/py-coverage/cover2gcov.py.in
        cover2gcov.py
    )

    # Unit tests for tangelo Python module.
    if(${PY_UNIT_TESTS})
        # Add each test.  Decorate the call with the coverage tool if we're in
        # coverage mode.
        foreach(src ${PY_UNIT_TEST_CASES})
            # Get the test's basename.
            get_filename_component(f "${src}" NAME_WE)

            # Name the testing file.
            set(py ${CMAKE_BINARY_DIR}/test-cases/py-unit-tests/${f}.py)

            # Configure the testing code into the test runner.
            file(READ ${src} UNIT_TEST_CODE)
            configure_file(testing/test-runners/unittest-runner.py.in ${py})

            # Name and create the test.
            set(name unit-test:py:${f})
            if(PY_COVERAGE_TEST)
                add_test(${name}
                    ${VENV_PYTHON_EXECUTABLE} -m trace --count -C CMakeFiles/tangelo-all.dir -m ${py}
                )
            else()
                add_test(${name}
                    ${VENV_PYTHON_EXECUTABLE} ${py}
                )
            endif()
        endforeach()

        if(PY_COVERAGE_TEST)
            # If performing Python coverage, we need to drop fake .gcda files in
            # a place where CTest will find them, in order to trigger the
            # analysis of the .cover files.
            function(signal_gcda name)
                set(fullpath "${CMAKE_BINARY_DIR}/CMakeFiles/tangelo-all.dir/${name}.gcda")
                add_custom_command(
                    OUTPUT ${fullpath}
                    COMMAND ${CMAKE_COMMAND} -E touch "${fullpath}"
                    COMMENT "Generating ${name}.gcda (signal file)"
                )
                list(APPEND GCDA_FILES "${fullpath}")
                set(GCDA_FILES "${GCDA_FILES}" PARENT_SCOPE)
            endfunction()

            signal_gcda("tangelo.__init__.py")
            signal_gcda("tangelo.plugin.py")
            signal_gcda("tangelo.util.py")
            signal_gcda("tangelo.js")
        endif()
    endif()

    # Web content tests.
    if(${WEB_CONTENT_TESTS})
        # Make sure PhantomJS is installed.
        list(APPEND TESTING_DEPENDENCIES ${PHANTOMJS_EXECUTABLE})

        # Generate the tests.
        foreach(js ${WEB_CONTENT_TEST_CASES})
            get_filename_component(f "${js}" NAME_WE)
            set(js_out ${CMAKE_BINARY_DIR}/tangelo/www/tests/web-content-tests/${f}.js)

            add_custom_command(OUTPUT ${js_out}
                COMMAND ${CMAKE_COMMAND} -DTEST_NAME="${f}"
                                         -DTEST_SOURCE="${js}"
                                         -DJS_OUT="${js_out}"
                                         -DTESTING_HOST="${TESTING_HOST}"
                                         -DTESTING_PORT="${TESTING_PORT}"
                                         -DSOURCE_DIR="${CMAKE_SOURCE_DIR}"
                                         -P ${CMAKE_SOURCE_DIR}/cmake/configure-web-content-test.cmake
                COMMAND ${CMAKE_COMMAND} -E touch ${js_out}
                DEPENDS ${js} ${CMAKE_SOURCE_DIR}/testing/test-runners/web-content-test-runner.js.in
                COMMENT "Generating web content test ${f}"
            )

            list(APPEND WEB_CONTENT_TEST_FILES ${js_out})

            add_tangelo_test(web-content:${f}
                ${PHANTOMJS_EXECUTABLE} ${js_out}
            )
        endforeach()
    endif()

    # Other tests.
    if(${OTHER_TESTS})
        set(TANGELO_VERSION_TEST ${CMAKE_BINARY_DIR}/test-cases/other-tests/tangelo-version.py)
        configure_file(testing/test-cases/other-tests/tangelo-version.py.in ${TANGELO_VERSION_TEST})
        add_test(other:tangelo-version
            ${VENV_PYTHON_EXECUTABLE} ${TANGELO_VERSION_TEST}
        )
    endif()
endif()

# The top-level dependency list.
get_property(ALL_COPIED_FILES GLOBAL PROPERTY copied_files)
set(TOP_LEVEL_DEPENDENCIES
    ${ALL_COPIED_FILES}
    ${MIN_JS_FILE}
    ${JS_FILE}
    ${GCDA_FILES}
)

if(${BUILD_DOCUMENTATION})
    list(APPEND TOP_LEVEL_DEPENDENCIES
        ${DOCUMENTATION_DEPENDENCIES}
    )
endif()

if(${BUILD_TANGELO_PYTHON_PACKAGE})
    list(APPEND TOP_LEVEL_DEPENDENCIES
        ${TANGELO_PACKAGE}
    )
endif()

if(${BUILD_TESTING})
    list(APPEND TOP_LEVEL_DEPENDENCIES
        ${TESTING_DEPENDENCIES}
        ${JS_UNIT_TEST_FILES}
        ${WEB_CONTENT_TEST_FILES}
        ${MONGO_MODULE}
        ${NLTK_MODULE}
    )
endif()

# The top-level target.
add_custom_target(
    tangelo-all
    ALL
    DEPENDS ${TOP_LEVEL_DEPENDENCIES}
)
