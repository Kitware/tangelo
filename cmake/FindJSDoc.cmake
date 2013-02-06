include(FindPackageHandleStandardArgs)

if(NOT JSDoc_EXECUTABLE)
    find_program(JSDoc_EXECUTABLE jsdoc)
endif()

find_package_handle_standard_args(JSDoc DEFAULT_MSG JSDoc_EXECUTABLE)
