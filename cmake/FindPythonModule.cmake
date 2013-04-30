function(find_python_module module version)
	string(TOUPPER ${module} module_upper)
	if(NOT PY_${module_upper})
		if(ARGC GREATER 2 AND ARGV2 STREQUAL "REQUIRED")
			set(${module}_FIND_REQUIRED TRUE)
		endif()
		# A module's location is usually a directory, but for binary modules
		# it's a .so file.
        execute_process(COMMAND "${PYTHON_EXECUTABLE}" "-c" 
            "import re, sys, ${module}\nprint re.compile('/__init__.py.*').sub('',${module}.__file__)\nx=${module}.__version__\nversion_match = len('${version}') <= len(x) and x[:len('${version}')] == '${version}'\nif not version_match:\n    sys.exit(2)\nelse:\n    sys.exit(0)"
			RESULT_VARIABLE _${module}_status 
			OUTPUT_VARIABLE _${module}_location
			#ERROR_QUIET OUTPUT_STRIP_TRAILING_WHITESPACE)
			OUTPUT_STRIP_TRAILING_WHITESPACE)
        if(NOT _${module}_status OR NOT ${_${module}_status} EQUAL 0)
            set(PY_${module_upper} ${_${module}_location} CACHE STRING 
                "Location of Python module ${module}")
        endif()
        if(${_${module}_status} EQUAL 2)
            message(WARNING "Version for module ${module} does not match required version ${version}")
        endif()    
	endif(NOT PY_${module_upper})
	find_package_handle_standard_args(PY_${module} DEFAULT_MSG PY_${module_upper})
endfunction(find_python_module)
