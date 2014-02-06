if(NOT Pep8_EXECUTABLE)
    find_program(Pep8_EXECUTABLE NAMES pep8 pep8-python2)
endif()

find_package_handle_standard_args(Pep8 DEFAULT_MSG Pep8_EXECUTABLE)
