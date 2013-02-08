include(FindPackageHandleStandardArgs)

find_package(Java REQUIRED)

if(NOT JSDoc_PATH)
    find_path(JSDoc_PATH jsrun.jar)
endif()
set(JSDoc_TEMPLATEPATH "${JSDoc_PATH}/templates/jsdoc")
set(JSDoc_EXECUTABLE ${Java_JAVA_EXECUTABLE})
set(JSDoc_ARGS -Djsdoc.dir=${JSDoc_PATH} -Djsdoc.template.dir=${JSDoc_TEMPLATEPATH} -jar ${JSDoc_PATH}/jsrun.jar ${JSDoc_PATH}/app/run.js)

find_package_handle_standard_args(JSDoc DEFAULT_MSG JSDoc_PATH JSDoc_EXECUTABLE JSDoc_TEMPLATEPATH)
