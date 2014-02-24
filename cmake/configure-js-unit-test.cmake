file(READ ${SOURCE_DIR}/testing/js-unit-tests/${TEST_NAME}.js TEST_SOURCE)
configure_file(
    ${SOURCE_DIR}/testing/scaffolding/jasmine-scaffold.html.in
    tangelo/web/tests/js-unit-tests/${TEST_NAME}.html
)
