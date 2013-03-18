include(FindPackageHandleStandardArgs)

if(NOT CherryPy_EXECUTABLE)
    find_program(CherryPy_EXECUTABLE NAMES cherryd2 cherryd)
endif()

find_package_handle_standard_args(CherryPy DEFAULT_MSG CherryPy_EXECUTABLE)
