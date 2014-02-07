set(alljs ${CMAKE_BINARY_DIR}/all-js-unit-tests.js)

file(WRITE ${alljs} "")
foreach(f IN LISTS JS_UNIT_TEST_CASES)
    file(READ ../testing/js-unit-tests/${f}.js js)
    file(APPEND ${alljs} "${js}")
endforeach()

file(READ ${alljs} TEST_SOURCE)
configure_file(
    ../testing/phantomjs/coverage-scaffold.html.in
    tangelo/web/tests/js-unit-tests/tangelojs-coverage.html
)
