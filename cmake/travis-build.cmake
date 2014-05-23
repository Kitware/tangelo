set(CTEST_SOURCE_DIRECTORY "$ENV{TRAVIS_BUILD_DIR}")
set(CTEST_BINARY_DIRECTORY "$ENV{TRAVIS_BUILD_DIR}/build")

include(${CTEST_SOURCE_DIRECTORY}/CTestConfig.cmake)
set(CTEST_SITE "Travis")
set(CTEST_BUILD_NAME "Linux-$ENV{TRAVIS_BRANCH}")
set(CTEST_CMAKE_GENERATOR "Unix Makefiles")

ctest_start(Continuous)
ctest_configure()
ctest_build()
ctest_test(RETURN_VALUE retval)

# This script will not return nonzero when tests fail, so we force an early exit
# here, just so that Travis reports a testing failure.  The actual dashboard
# submission happens in a separate travis invocation.
if (NOT retval EQUAL 0)
    message(FATAL_ERROR "Some test(s) failed.")
endif()
