file(READ "${TEST_SOURCE}" TEST_SUITE)
configure_file(
    ${SOURCE_DIR}/testing/scaffolding/web-content-test-scaffold.js.in
    ${JS_OUT}
    @ONLY
)
