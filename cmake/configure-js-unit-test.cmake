file(READ "${SOURCE_FILE}" TEST_SOURCE)
configure_file(
    ${SOURCE_DIR}/testing/test-runners/jasmine-runner.html.in
    tangelo/www/tests/js-unit-tests/${TEST_NAME}.html
)
