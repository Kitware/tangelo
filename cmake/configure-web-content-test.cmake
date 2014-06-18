file(READ "${TEST_SOURCE}" TEST_SUITE)
configure_file(
    ${SOURCE_DIR}/testing/test-runners/web-content-test-runner.js.in
    ${JS_OUT}
    @ONLY
)
