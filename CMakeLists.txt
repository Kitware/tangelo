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
            if(${index} EQUAL -1)
                string(FIND ${f} ".in" index)
            endif()
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

    # Install requests (for Python testing).
    set(REQUESTS_MODULE ${VENV_DIR}/lib/python2.7/site-packages/requests/__init__.py)
    add_custom_command(
        OUTPUT ${REQUESTS_MODULE}
        COMMAND ${PIP_EXECUTABLE} install --upgrade --force-reinstall requests
        DEPENDS ${PIP_EXECUTABLE}
        COMMENT "Installing requests"
    )

    # Install nose (for Python testing).
    set(NOSE_EXECUTABLE ${VENV_DIR}/bin/nosetests)
    add_custom_command(
        OUTPUT ${NOSE_EXECUTABLE}
        COMMAND ${PIP_EXECUTABLE} install --upgrade --force-reinstall nose
        DEPENDS ${PIP_EXECUTABLE}
                ${REQUESTS_MODULE}
        COMMENT "Installing nose"
    )
endif()

# Show/hide testing options depending on whether testing is enabled.
if(${BUILD_TESTING})
    set(PEP8_TESTS ON CACHE BOOL "Generate style tests for Python source files (via pep8).")
    set(TANGELO_TESTS ON CACHE BOOL "Generate unit tests for Tangelo web behavior.")
    set(TESTING_HOST localhost CACHE STRING "The host to run Tangelo on for the test suite.")
    set(TESTING_PORT 50047 CACHE STRING "The port number to run Tangelo for the test suite.")

    mark_as_advanced(TESTING_HOST)

    mark_as_advanced(CLEAR PEP8_TESTS
                           TANGELO_TESTS
                           TESTING_PORT
    )
else()
    mark_as_advanced(FORCE PEP8_TESTS
                           TANGELO_TESTS
                           TESTING_PORT
    )
endif()

# Create a binary directory to hold various timestamps.
file(MAKE_DIRECTORY ${CMAKE_BINARY_DIR}/stamps)

# These files should be validated with pep8.
set(PEP8_FILES
    ${CMAKE_SOURCE_DIR}/scripts/tangelo
    ${CMAKE_SOURCE_DIR}/scripts/vtkweb-launcher.py
    ${CMAKE_SOURCE_DIR}/scripts/setup.py.in
    ${CMAKE_SOURCE_DIR}/tangelo/__init__.py
    ${CMAKE_SOURCE_DIR}/tangelo/__main__.py.in
    ${CMAKE_SOURCE_DIR}/tangelo/info.py
    ${CMAKE_SOURCE_DIR}/tangelo/server.py
    ${CMAKE_SOURCE_DIR}/tangelo/stream.py
    ${CMAKE_SOURCE_DIR}/tangelo/tool.py
    ${CMAKE_SOURCE_DIR}/tangelo/util.py
    ${CMAKE_SOURCE_DIR}/tangelo/vtkweb.py
    ${CMAKE_SOURCE_DIR}/tangelo/websocket.py
    ${CMAKE_SOURCE_DIR}/www/service/celery.py
    ${CMAKE_SOURCE_DIR}/www/service/config.py
    ${CMAKE_SOURCE_DIR}/www/service/impala-json.py
    ${CMAKE_SOURCE_DIR}/www/service/mongo.py
    ${CMAKE_SOURCE_DIR}/www/service/svg2pdf.py
)

# These files should be copied to the build directory.
glob_recurse_ungit(TANGELO_MODULE_SOURCES tangelo/*)
glob_recurse_ungit(TANGELO_DAEMON_SCRIPTS assets/daemon/*)
set(TANGELO_SOURCES
    ${TANGELO_WEB_SOURCES}
    ${TANGELO_MODULE_SOURCES}
    ${TANGELO_DAEMON_SCRIPTS}
    scripts/tangelo
    scripts/tangelo-passwd
    scripts/vtkweb-launcher.py
    assets/conf/tangelo.global.conf
    assets/conf/tangelo.local.conf
    assets/data/get-flickr-data.py
    assets/images/tangelo.ico
)

# Configure setup.py
configure_file(scripts/setup.py.in ${CMAKE_BINARY_DIR}/tangelo/setup.py)
configure_file(tangelo/__main__.py.in ${CMAKE_BINARY_DIR}/tangelo/tangelo/__main__.py)

if(${BUILD_TANGELO})
    # Copy package files to build directory.
    foreach(m ${TANGELO_SOURCES})
        set(outfile ${CMAKE_BINARY_DIR}/tangelo/${m})
        copy_file(${m} ${outfile})
        list(APPEND TANGELO_BUILD_FILES ${outfile})
    endforeach()

    list(APPEND TANGELO_BUILD_FILES
        ${CMAKE_BINARY_DIR}/tangelo/tangelo/__main__.py
        ${CMAKE_BINARY_DIR}/tangelo/setup.py
    )

    # Also copy the README file.
    copy_file(README.rst ${CMAKE_BINARY_DIR}/tangelo/README)
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

    # Python style tests.
    if(${PEP8_TESTS})
        foreach(f ${PEP8_FILES})
            add_test(style:py:pep8:${f} ${PEP8_EXECUTABLE} --ignore=E501 ${f})
        endforeach()

        # Make sure pep8 is installed.
        list(APPEND TESTING_DEPENDENCIES ${PEP8_EXECUTABLE})
    endif()

    # Configure Python test cases' fixture module.
    if(${TANGELO_TESTS})
        set(TESTING_WEB_CONTENT "${CMAKE_SOURCE_DIR}/tests/www")
        configure_file(
            tests/fixture/fixture.py.in
            ${CMAKE_BINARY_DIR}/tests/fixture.py
            @ONLY
        )

        # Generate Python test cases.
        file(GLOB PYTHON_TESTS
            ${CMAKE_SOURCE_DIR}/tests/*.py
        )

        foreach(case_src ${PYTHON_TESTS})
            get_filename_component(f "${case_src}" NAME_WE)
            set(case ${CMAKE_BINARY_DIR}/tests/${f}.py)
            add_custom_command(OUTPUT ${case}
                COMMAND ${CMAKE_COMMAND} -E copy_if_different
                                         ${case_src}
                                         ${case}
                DEPENDS ${case_src}
                COMMENT "Generating test ${f}"
            )

            add_test(tangelo:${f}
                ${NOSE_EXECUTABLE} ${case}
            )

            list(APPEND PYTHON_TEST_FILES ${case})
        endforeach()

        # Include nose as a testing dependency, as well as the tests themselves.
        list(APPEND TESTING_DEPENDENCIES
            ${NOSE_EXECUTABLE}
            ${PYTHON_TEST_FILES})
    endif()
endif()

# The top-level dependency list.
get_property(ALL_COPIED_FILES GLOBAL PROPERTY copied_files)
set(TOP_LEVEL_DEPENDENCIES
    ${ALL_COPIED_FILES}
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
    )
endif()

# The top-level target.
add_custom_target(
    tangelo-all
    ALL
    DEPENDS ${TOP_LEVEL_DEPENDENCIES}
)
