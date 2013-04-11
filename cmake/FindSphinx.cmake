include(FindPackageHandleStandardArgs)

if(NOT Sphinx_EXECUTABLE)
    find_program(Sphinx_EXECUTABLE sphinx-build sphinx-build2)
endif()

find_package_handle_standard_args(Sphinx DEFAULT_MSG Sphinx_EXECUTABLE)
