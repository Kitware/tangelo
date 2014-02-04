if(NOT PhantomJS_EXECUTABLE)
    find_program(PhantomJS_EXECUTABLE phantomjs)
endif()

find_package_handle_standard_args(Pep8 DEFAULT_MSG PhantomJS_EXECUTABLE)
