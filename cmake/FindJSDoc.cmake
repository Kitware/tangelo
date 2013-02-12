include(FindPackageHandleStandardArgs)

if(NOT JSDoc_EXECUTABLE)
    # Look for an executable called "jsdoc".
    find_program(JSDoc_EXECUTABLE jsdoc)

    # If it can't be found, try to construct the java commandline.
    if(NOT JSDoc_EXECUTABLE)
        find_package(Java REQUIRED)

        if(NOT JSDoc_PATH)
            find_path(JSDoc_PATH jsrun.jar)
        endif()

        set(JSDoc_TEMPLATEPATH "${JSDoc_PATH}/templates/jsdoc")
        set(JSDoc_ARGS -Djsdoc.dir=${JSDoc_PATH} -Djsdoc.template.dir=${JSDoc_TEMPLATEPATH} -jar ${JSDoc_PATH}/jsrun.jar ${JSDoc_PATH}/app/run.js)
        set(JSDoc_TEST_EXECUTABLE ${Java_JAVA_EXECUTABLE} ${JSDoc_ARGS})

        # Test the resulting "executable" by running with the help flag and
        # observing the return value.
        execute_process(
            COMMAND ${JSDoc_TEST_EXECUTABLE} -h
            RESULT_VARIABLE success
            OUTPUT_QUIET
            ERROR_QUIET)

        if(NOT ${success} EQUAL 0)
            string(REPLACE ";" " " cmdline "${JSDoc_TEST_EXECUTABLE}")
            message(WARNING "Could not determine invocation for JSDoc (tried \"${cmdline}\") - please edit JSDoc_EXECUTABLE by hand or set JSDoc_PATH to the location you extracted the jsdoc zip file.")
        else()
            set(JSDoc_EXECUTABLE ${JSDoc_TEST_EXECUTABLE} CACHE FILE "jsdoc executable" FORCE)
        endif()
    endif()

endif()

find_package_handle_standard_args(JSDoc DEFAULT_MSG JSDoc_PATH JSDoc_EXECUTABLE JSDoc_TEMPLATEPATH)
