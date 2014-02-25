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
infrastructure, and Javascript components, forming the clientside support
libraries.  The standard testing philosophy prescribes *unit tests* for both
halves, to continuously confirm that low-level pieces (e.g., at the level of
individual functions) are behaving as expected.

However, because Python and Javascript are both designed to afford maximum
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
*coverage tests* for both the Python and Javascript code.  These tests simply
measure how much of each code base is "touched" by the unit and web content
tests.  Python coverage testing happens via the Coverage program, while
Blanket.js performs Javascript coverage testing.

Javascript Unit Tests
---------------------

The directory ``testing/js-unit-tests`` contains several Javascript files
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

Javascript Style Tests
----------------------

JSLint is a static analyzer for Javascript that catches many slips of the
fingers and other bad practices that are allowed by the language but are
commonly believed to lead to poor, error-prone, debug-resistant code.  It also
prescribes a strict coding style standard which has been adopted by the Tangelo
project (see :doc:`coding-style-guide`).

The Javascript style tests work by running JSLint on each Javascript source
file.  Keeping new code up to the JSLint standard by making these tests pass
helps to inspire confidence in the quality of our code.

Python Style Tests
------------------

Similarly to JSLint for Javascript, Pep8 is a Python program that enforces the
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

.. todo::
    Fill in web content tests section

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

The Javascript unit tests are collected into a single, overarching test suite,
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

.. todo::
    Fill in "writing tests" section
