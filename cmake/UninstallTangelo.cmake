execute_process(
    COMMAND venv/bin/pip uninstall -y tangelo
    RESULT_VARIABLE result
)

if(NOT "${result}" STREQUAL "0")
    message(STATUS "Could not uninstall Tangelo from virtual environment (it may just not have been installed yet)")
endif()
