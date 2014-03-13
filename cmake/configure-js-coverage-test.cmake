set(alljs ${CMAKE_BINARY_DIR}/all-js-unit-tests.js)

file(WRITE ${alljs} "")
foreach(f IN LISTS JS_UNIT_TEST_CASES)
    file(READ "${f}" js)
    file(APPEND ${alljs} "${js}")
endforeach()

file(READ ${alljs} TEST_SOURCE)
configure_file(
    ${SOURCE_DIR}/testing/scaffolding/coverage-scaffold.html.in
    tangelo/web/tests/js-coverage/tangelojs-coverage.html
)
