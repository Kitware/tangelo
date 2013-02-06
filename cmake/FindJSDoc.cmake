include(FindPackageHandleStandardArgs)

if(NOT JSDOC_EXECUTABLE)
    find_program(JSDOC_EXECUTABLE jsdoc)
endif()

find_package_handle_standard_args(JSDOC DEFAULT_MSG JSDOC_EXECUTABLE)
