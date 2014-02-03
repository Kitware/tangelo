if(NOT PhantomJS_EXECUTABLE)
    find_program(PhantomJS_EXECUTABLE phantomjs)
    find_file(PhantomJS_jasmine_runner run-jasmine.js /usr/share/phantomjs/examples)
endif()

find_package_handle_standard_args(Pep8 DEFAULT_MSG PhantomJS_EXECUTABLE)
