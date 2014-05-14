===============
    Testing
===============

Tangelo includes an extensive test suite meant to stress several parts of the
system from different angles.  All testing is driven by CTest, and the test
suite build can be enabled by setting the ``BUILD_TESTING`` option to ``ON`` in
the CMake configuration step.  To run the test suite, build Tangelo by running
``make`` or ``ninja`` as discussed above, then run the ``ctest`` program in the
build directory.  The test suite will run, and a report on passes/failures will
be printed at the end.

Test Types
==========

Because Tangelo brings together multiple technologies into one place, there are
several types of tests that run on different platforms to test the various
components.  Tangelo is built up from Python components, forming the server
infrastructure, and JavaScript components, forming the clientside support
libraries.  The standard testing philosophy prescribes *unit tests* for both
halves, to continuously confirm that low-level pieces (e.g., at the level of
individual functions) are behaving as expected.

However, because Python and JavaScript are both designed to afford maximum
programming flexibility - sometimes at the cost of enforced code quality -
*style tests* also form an integral part of our testing strategy.  These tests
use static analysis to enforce certain coding conventions designed to prevent
programming errors that are technically allowed by the languages, but are not
desirable in production code.

While unit and style tests stress the components in isolation, the real work of
Tangelo occurs when the two halves interact to enable rich web applications.
Therefore, the test suite also includes *web content tests*, which work by
loading a web page in PhantomJS, then e.g. examining the page's DOM to confirm
that the appliation has behaved correctly.  This can take the form of extracting
an image and comparing it to a baseline, or examining the status code of the
HTTP request that delivered the page, etc.

Finally, to confirm that our tests are far-reaching enough, we also perform
*coverage tests* for both the Python and JavaScript code.  These tests simply
measure how much of each code base is "touched" by the unit and web content
tests.  Python coverage testing happens via the Coverage program, while
Blanket.js performs JavaScript coverage testing.

JavaScript Unit Tests
---------------------

The directory ``testing/js-unit-tests`` contains several JavaScript files
containing Jasmine tests.  Each file has a single call to the ``describe()``
function, which declares a test suite.  The second argument is itself a function
that will run to drive the suite - this function contains calls to the ``it()``
function, each of which implements one test.

The CMake infrastructure takes the code from each file and places it into a
scaffold template (found at ``testing/scaffolding/jasmine-scaffold.html.in``)
forming a web page which, when loaded, runs the Jasmine test and displays the
result.  This page will be placed in the ``tangelo/web/tests/js-unit-tests``
directory within the build directory.  You can view the files directly to see
the Jasmine report, but CTest will run each of these tests by loading the page
in PhantomJS, then extracting the pass/fail information from the report.  This
way, you can run the tests from the command line using the ``ctest`` program.

Python Unit Tests
-----------------

Python unit testing is carried out using the ``unittest`` module, which comes
with the Python standard library.  The tests are found in the
``testing/py-unit-tests`` directory.  Each file declares a class named
``Tester``, which inherits from ``unittest.TestCase``, and represents a single
test suite.  The methods of this class correspond to individual tests in the
suite; each such test's method name begins with ``test_``.  The `unittest
documentation <http://docs.python.org/2/library/unittest.html>`_ has more
information on how to write the actual tests; you may also want to consult the
existing tests to see how they work.

Each of the testing files ends with this snippet of Python code:

.. code-block:: python

    if __name__ == "__main__":
        unittest.main()

This turns the file into a standalone script that automatically runs the test
suite declared therein.  CMake can therefore run this script directly to perform
the unit test.

JavaScript Style Tests
----------------------

JSLint is a static analyzer for JavaScript that catches many slips of the
fingers and other bad practices that are allowed by the language but are
commonly believed to lead to poor, error-prone, debug-resistant code.  It also
prescribes a strict coding style standard which has been adopted by the Tangelo
project (see :doc:`coding-style-guide`).

The JavaScript style tests work by running JSLint on each JavaScript source
file.  Keeping new code up to the JSLint standard by making these tests pass
helps to inspire confidence in the quality of our code.

Python Style Tests
------------------

Similarly to JSLint for JavaScript, Pep8 is a Python program that enforces the
`PEP8 standard <http://legacy.python.org/dev/peps/pep-0008/>`_ for Python code.
These tests keep the Python code in line with common Python programming idioms,
and are an easy way to "standardize" code against strange bugs that might
otherwise creep in.  The one warning we suppress in these tests is that of line
length:  PEP8 recommends all lines of code be capped at 79 characters to keep
code readable.  However, Tangelo includes some lines that are longer than this
limit and are burdensome to shoehorn into multiple, shorter lines.  In some
cases, doing so may even reduce the clarity of the code, or possibly even cause
bugs to be introduced.  The project policy is therefore not to worry about long
lines.

Pylint is a different program that peforms heavier static analysis on Python
code.  It is purposefully zealous in its reported warnings, knowingly reporting
features of code that may be correct as they stand, but that can in a general
sense indicate a problem with the code.  Therefore, these tests are disabled by
default, but it is a good idea to run them occasionally in case they uncover
actual bugs.

Web Content Tests
-----------------

Web content tests work by retrieving a URL and loading it into PhantomJS, then
running a user-specified test function on the resulting DOM.  A simple example
would read as follows:

.. code-block:: javascript

    declareTest({
        name: "200 - existing page should return a 200 OK message",
        url: "/",
        test: function (page, info) {
            "use strict";

            console.log("expected status code: 200");
            console.log("received status code: " + info.status);

            return info.status === 200;
        }
    });

This test loads the Tangelo root page, then invokes the ``test()`` function,
passing it a PhantomJS ``page`` object, and an ``info`` object containing some
metadata about the URL retrieval.  In this case, the test simply verifies that
the status code on loading the URL is 200, indicating that the server is
generally delivering webpages upon request.  It is possible to compute various
values from the DOM using the ``page.evaluate()`` function, which takes a
function of no arguments which will be run in the context of the DOM (as though
it were executing in, e.g., and actual web browser).  For more information, see
the PhantomJS documentation.

The ``declareTest()`` function can be called with a variety of arguments to
create different types of tests:

.. js:function:: declareTest(cfg)

    Declares a web content test, according to the information carried in `cfg`.

    :param object cfg: A configration object, with contents as specified below.

    :param string cfg.name: A descriptive name for the test.

    :param string cfg.url: The URL to load in order to carry out the test.

    :param string cfg.method: The HTTP method to use to retrieve the URL.  This
        can be useful for testing, e.g., REST services.

    :param object-or-string cfg.data: A JavaScript object of key-value pairs, or
        a string, to send as the request data for, e.g., POST requests.

    :param list-of-number cfg.size: The size that PhantomJS should use for its
        virtual window.

    :param string cfg.imageFile: An image file to use for image-based comparison
        tests.

    :param number cfg.threshold: A number representing the error threshold for
        image-based comparison tests.

    :param function(page,info) cfg.test: A function that implements the test
        itself.  This function will be invoked with two arguments: the PhantomJS
        page object, and an :js:data:`info` object.  The function should return
        either a boolean value to indicate passing or failure, or a
        :js:class:`Promise` object that does the same.  Promises should be used when
        asynchronous activity is involved: since the asynchronous callback cannot
        simply ``return`` the boolean value, it must be sent back via promise, but
        the test scaffolding is built to seamlessly handle this case.

.. js:function:: toImageData(pngData)

Returns a promise that delivers an array of pixel data as converted from the PNG
data blob passed in as the argument.

The function works by converting the PNG data to base64, then creating a
JavaScript ``Image`` object using the base64-encoded PNG data, and finally using
a Canvas element to extract the pixel data.  As such, the return value is in the
format returned by a Canvas 2D context.

``toImageData()`` returns a promise because the process of converting to pixel
data via a Canvas object requires asynchronously waiting for the ``Image``
object to be constructed.

.. js:function:: compareImages(pngData1, pngData2, comparator)

A convenience function for comparing two PNG binary blobs.  ``compareImages()``
works by first converting the PNG data blobs to pixel data arrays (using
:js:func:`toImageData` internally), then invokes the ``comparator`` argument -
a function of two arguments - on the two arrays.  The result is a promise that
delivers the return value of ``comparator``, which should be a boolean.

If ``comparator`` is not specified, a default comparator is invoked which
returns false if the image dimensions do not match, true if they do match and
the L2 difference between the pixel arrays falls below the threshold value
(`cfg.threshold` in the :js:func:`declaretest`), and false otherwise.

This default function may not be appropriate for most comparison tasks, but it
is the simplest possible reasonable function for image comparison.  In general,
you may want to specify your own.

.. js:function:: saveImage(imgData, filename)

A function that takes a pixel array `imgData` (as returned by, e.g.,
:js:func:`toImageData`) and writes out a PNG file `filename`.  It is possible
that this function will fail, e.g., if the user that is running Tangelo does not
have write permission in the directory where this function is invoked.

.. js:data:: info

    The info object contains metadata about the test and the loading of the URL.
    Its contents are as follows:

    * `info.testName`, `info.url`, `info.imageFile`, `info.method`, `info.data`,
      `info.size`, `info.threshold` - these are copies of the properties of the
      same names passed to `declareTest()`.

    * `info.imageData` - The data from `info.imageFile` encoded as base64.

    * `info.status` - The HTTP status code associated with retrieving the test's
      URL, as an integer.

    * `info.statusText` - A string associated to the status code.

.. js:class:: Promise(callback)

A promise is a general programming notion of *deferring the delivery of
computational results* to a later time when they are fully available.  In a web
programming environment, promises are necessary to generalize the notion of
"function return value" to asynchonrous contexts.

In particular, if a web content test needs to perform asynchronous actions, it
cannot simply issue a ``return`` from within the asynchronous callback, as the
testing function itself will have already finished running, and will need to
return some value besides the desired return value from the callback.

The solution is to return a promise from the testing function that wraps the
the callback, capturing its eventual return value.  The testing system can distinguish
between bare return values of boolean type, and promises, and will take the
appropriate action to maintain the abstraction that a simple *true* or *false*
value always comes back from the test.

The `callback` argument is a function of one argument, named `deliver`.
`callback` should contain any asynchonous actions that are necessary to
computing the test result.  However, in place of using a return statement, the
callback should invoke `deliver` on the result.  An example will make this
clear:

.. code-block:: javascript

    function testFunc(page, info) {
        return new Promise(function (deliver) {
            asyncAction(page, function (result) {
                if (resultIsGood(result)) {
                    deliver(true);
                } else {
                    deliver(false);
                }
            });
        });
    }

Ordinarily, `testFunc()` would directly call `asyncAction()`, and it would have
no way to "return" true or false from it's if-then statement.  However, using a
``Promise``, the `deliver()` argument takes the place of the return statement.

The ``Promise`` object constructed this way does not execute its `callback`
argument immediately.  Instead, it contains a single method named `then()`,
which is called with a `deliver` argument.  When it is called, it simply invokes
`callback` with `deliver` as the argument.

In the web content test scaffolding, if the test function returns a ``Promise``,
the test driver knows to invoke its `then()` method to capture the result of the
asynchonous action, and deliver a pass/fail signal to CTest.  In other words, if
possible, a test function should return `true` or `false` directly; otherwise,
it should return a ``Promise`` as in the example above.  From the point of view
of CTest, both styles seem to deliver a boolean value describing the test run.

Coverage Tests
--------------

Coverage tests measure how much of the total mass executable instructions has
been run by a test suite.  This "meta test" is important in designing test
suites, since, at a bare minimum, every line in the code base should be stressed
by one test.

The Python unit tests can be run by the ``coverage`` program, which maintains a
report on disk of what Python lines have been run so far.  When the test suite
is run as a whole, each Python unit test will be dependent on a special
"coverage clearing" test the removes the on-disk cache from the last run.
Another special test, which generates an HTML coverage report, depends in turn
on each unit test.  This report can be found in the
``tangelo/web/tests/python-coverage`` directory within the build directory.

The JavaScript unit tests are collected into a single, overarching test suite,
which is run under the supervision of Blanket.js, which generates an HTML
coverage report, similarly to the Python ``coverage`` program.  This report can
be found at ``tangelo/web/tests/js-unit-tests/tangelojs-coverage.html`` in the
build directory.

While achieving 100% coverage is difficult or may even be impossible, striving
to increase the percent coverage of the entire codebase is an important testing
strategy.  To this end, one general development policy is to always ship a test
covering new functionality, or demonstrating bug fixes in action, etc.  For
instance, if a pull request is submitted that includes a new behavior but no
tests, the requester may be asked to add test before submitting again.

Writing Tests
=============

When creating new functionality for Tangelo, or fixing bugs, it is important to
include a test that demonstrates the desired behavior.  For example, if a pull
request is made against some feature of Tangelo, but has no tests, the author
may be requested to add a test before it can be accepted.

The goal of writing a test is to isolate the behavior under observation, and
provide a minimal amount of code to bring about that behavior.  If the test is a
unit test, it is possible to include several individual test functions (with
``test_*`` methods under Python's ``unittest`` module, or the ``it()`` function
in Jasmine) in a single test suite.  For an example, see
``testing/js-unit-tests/accessor.js``.

If it is a web content test, the testing infrastructure is somewhat more
restrictive, as only a single test function is allowed per test.  However, since
web content tests are less based on testing a single aspect of the code base,
this may be more appropriate.  In these cases, you can use PhantomJS to perform
arbitrary computations on the web page DOM under examination, or use the
metadata delivered to the test function to examine the status code, etc.  Here
too it is important to test a specific behavior of the web page.  For an
example, see ``testing/web-content-tests/dynamic-control-panel.js``.  That
example loads a page, simulates mouse interaction, waits for a reasonable delay,
then examines the resulting DOM, looking for a particular expected property to
be satisfied.
