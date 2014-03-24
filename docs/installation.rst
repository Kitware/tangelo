====================
    Installation
====================

Tangelo currently runs on Linux, OS X, and Windows.  It may run on other
UNIXlike operating systems as well, but these are the three supported platforms.

There are two ways to install Tangelo: from the Python Package Index, or from
source.

Installing from the Python Package Index
========================================

The latest release version of Tangelo can always be found in the `Python Package
Index <http://pypi.python.org/pypi>`_.  The easiest way to install Tangelo is
via Pip, a package manager for Python.

**1. Install software dependencies**

Install the following software:

* Python 2.7
* Pip

On Linux and OS X computers, your local package manager should be sufficient for
installing these.  On Windows, please consult this `guide
<http://docs.python-guide.org/en/latest/starting/install/win/>`_ for advice
about Python and Pip.

**2. Install the Tangelo Python package**

Use this command in a shell to install the Tangelo package and its dependencies: ::

    pip install tangelo

You may need to run this command as the superuser, using ``sudo`` or similar.

Building and Installing from Source
===================================

Tangelo is developed on `GitHub <https://github.com/Kitware/tangelo>`_.  If you
wish to contribute code, or simply want the very latest development version, you
can download, build, and install from there.

Linux and OS X
--------------

**1. Install software dependencies**

Install the following software, which is required to download, build, deploy,
and run Tangelo:

* GNU Make
* CMake
* Git
* Python 2.7
* Node.js

**2. Check out the Tangelo source code**

Issue this git command to clone the Tangelo repository: ::

    git clone git://github.com/Kitware/tangelo.git

This will create a directory called ``tangelo`` containing the source code.

**3. Configure the build**

Create a build directory and move into it: ::

    mkdir build

Run ``cmake`` or ``ccmake`` to configure, supplying the source code directory as
its argument. ::

    cd build
    cmake ../tangelo

``ccmake`` will present you with a curses-based configuration interface that
will allow you to edit the configuration options (some operating systems
provide ``ccmake`` and ``cmake`` in different packages - check your local
documentation).  The "top-level" options are as follows:

    * ``BUILD_DOCUMENTATION`` - Generates Tangelo documentation (the very
      documentation you are reading!).

    * ``BUILD_TESTING`` - Generates a CTest suite for validating the JavaScript
      code with `JSlint <http://www.jslint.com/>`_, Python code with `pep8
      <https://pypi.python.org/pypi/pep8>`_ and `Pylint
      <http://www.pylint.org/>`_, running JavaScript unit tests with `Jasmine
      <http://pivotal.github.io/jasmine/>`_, Python unit tests with the
      `unittest module <http://docs.python.org/2/library/unittest.html>`_,
      JavaScript coverage with `Blanket.js <http://blanketjs.org/>`_, Python
      coverage with the `coverage tool
      <https://pypi.python.org/pypi/coverage>`_, and finally, web-based content
      tests using `PhantomJS <http://phantomjs.org/>`_.

    * ``NPM_EXECUTABLE`` - The path to the ``npm`` (`Node Package Manager
      <https://www.npmjs.org/>`_) program.  This is used to perform local (in
      the build directory) installs of `UglifyJS
      <https://github.com/mishoo/UglifyJS2/>`_, which is used to minify the
      ``tangelo.js`` output file, as well as other utilities necessary for
      testing (JSLint and PhantomJS).  Because NPM is needed for the actual
      build step, it appears as a top-level option in the configure step.

Hitting ``c`` to configure will cause dependent options to appear.  If
``BUILD_TESTING`` is set to ``ON``, the dependent options are:

    * ``VIRTUALENV_EXECUTABLE`` - The path to the `Virtualenv
      <https://pypi.python.org/pypi/virtualenv>`_ program, used to perform local
      (in the build directory) intalls of Python packages necessary for
      a testing deployment of Tangelo.

    * ``JS_LINT_TESTS`` - Generates JavaScript style validation tests using the
      JSLint program (installed via NPM).

    * ``JS_UNIT_TESTS`` - Generates JavaScript unit test suites to stress
      components of ``tangelo.js``.  These tests are carried out via JasmineJS.

    * ``PY_LINT_TESTS`` - Generates lint tests for Python source files using
      Pylint, which is installed via Virtualenv.  Note that this variable is set
      to ``OFF`` by default.  This is because Pylint is extremely strict and
      rigid by design, knowingly warning about code features which may not
      actually be undesirable or error-prone in context.  This option is useful
      mainly as an occasional check for the developer to look for fatal errors.
      Unlike the other test types, it is **not** a development goal to eliminate
      all Pylint warnings.  ``testing/pylint/pylintrc`` in the source files
      contains a configuration file that suppresses some of the less useful
      warnings.

    * ``PY_STYLE_TESTS`` - Generates style tests for Python source files using
      Pep8.  The line length rule is suppressed in these tests, but it is
      generally good practice to conform to the other Pep8 rules when preparing
      Python code for Git commits.

    * ``PY_UNIT_TESTS`` - Generates unit tests for the Python components.  These
      are carried out using the ``unittest`` module that is part of the Python
      standard library.

    * ``PY_COVERAGE_TEST`` - Sets up the Python unit tests to also perform
      coverage analysis.

    * ``WEB_CONTENT_TESTS`` - Generates tests to verify the content of web pages
      relying on some aspect of the Tangelo server or clientside libraries.
      These are carried out with PhantomJS.

    * ``TESTING_PORT`` - Specifies what port Tangelo should run on to carry out
      the web content tests.

Documentation for Tangelo is built using `Sphinx <http://sphinx-doc.org/>`_.  It
is installed locally via Virtualenv, so if ``BUILD_DOCUMENTATION`` is set to
``ON``, the ``VIRTUALENV_EXECUTABLE`` option will appear.

Finally, there are some options marked as "advanced" (you can toggle their
visibility by pressing ``t`` in CCMake):

    * ``BUILD_TANGELO`` and ``BUILD_TANGELO_PYTHON_PACKAGE`` - These control
      whether Tangelo is actually built.  They are mainly useful for developers
      working on, e.g., documentation and not wishing to spend any time building
      Tangelo itself.  Normally you will not need to disable these options.

    * ``TESTING_HOST`` - Just as ``TESTING_PORT`` specifies the port for Tangelo
      to run on, this option specifies the hostname to use when launching
      Tangelo.  Generally, ``localhost`` is the correct value for this option,
      but you can modify this if necessary for an unusual configuration.

**4. Build the server**

Run the ``make`` command: ::

    make

This will create a Python package ``Tangelo-[version].tar.gz`` in the
``dist`` directory.

**5. Install the package**

To install this package into your Python environment, run::

    pip install dist/Tangelo-[version].tar.gz

This installs the `tangelo` Python package along with its dependencies
and places the ``tangelo`` executable in
a standard location such as ``/usr/local/bin``. After this step
you should be able to execute ``which tangelo`` to see where it has
been installed.

If you are reinstalling Tangelo after a ``git pull`` or source code change,
run the following::

    make
    pip uninstall tangelo
    pip install dist/Tangelo-[version].tar.gz

**6. Start the server!**

The ``tangelo`` program controls startup and
shutdown of the Tangelo server.  Run::

    tangelo start

to launch the server (on http://localhost:8080 by default).  Point your browser
there and you should see the "Tangelo sunrise."

Windows
-------

**1. Install Git**

GitHub has great `instructions <https://help.github.com/articles/set-up-git>`_
for setting up Git.

**2. Install CMake**

Download and install the latest version of `CMake
<http://www.cmake.org/cmake/resources/software.html>`_. Use the link marked
*Win32 Installer*.

**3. Install Node.js**

A Windows installer can be found `here <http://nodejs.org/download/>`_.

**4. Install Python**

Download and install `Python 2.7 <http://www.python.org/download/releases/2.7>`_. Use the
link marked *Windows X86-64 MSI Installer*.

**5. Install Python packages**

Download and install the `Windows Python packages <http://www.lfd.uci.edu/~gohlke/pythonlibs/>`_ for ``pip``, ``pymongo``, and ``twisted``.
Choose the package links ending in ``amd64-py2.7.exe``.

**6. Clone the Tangelo Repository**

Open the Git Bash shell and execute the following::

    cd ~
    git clone https://github.com/Kitware/tangelo.git

This will create a new directory in your home directory called ``tangelo``
containing the Tangelo sources.

**7. Install Ninja**

Create a build directory::

    cd tangelo
    mkdir build

Download and unzip `Ninja <https://github.com/martine/ninja/downloads>`_.
This extracts to the single file
*ninja.exe*. We'll want the Ninja executable handy, so we'll put it into your build
directory. You can do this all from the Git Bash shell::

    cd build
    curl -OL https://github.com/martine/ninja/releases/download/v1.4.0/ninja-win.zip
    unzip ninja-win.zip

**8. Configure and build**

From the build directory, configure the Tangelo build using CMake::

    cmake -G Ninja ..

Then build the project using the ``ninja`` build tool::

    ninja

**9. Install the package**

To install this package into your Python environment, run::

    /c/Python27/Scripts/pip install dist/Tangelo-[version].tar.gz

This installs the `tangelo` Python package along with its dependencies
and places the ``tangelo`` executable in ``/c/Python27/Scripts``.

If you are reinstalling Tangelo after a ``git pull`` or source code change,
run the following from the build directory::

    ninja
    /c/Python27/Scripts/pip uninstall tangelo
    /c/Python27/Scripts/pip install dist/Tangelo-[version].tar.gz

**10. Start the server!**

The ``tangelo`` program controls startup and
shutdown of the Tangelo server.  Run::

    /c/Python27/Scripts/tangelo start

to launch the server (on `localhost:8000 <http://localhost:8000>`_ by default).
Point your browser there and you should see a collection of demo applications
to get you started.

Running the Tests
-----------------

Now that you have built Tangelo, you may wish to run the included test suite to
confirm that all is well.  From the build directory, run the ``ctest`` command
with no arguments to run all the tests.  After they complete, a summary report
showing the number of tests passed will be printed.  Don't worry too much if you
find that the coverage tests have failed.  However, if you see other failures,
we would like to hear about them.  Rerun the tests using ``ctest
--output-on-failure`` and drop us a note at `tangelo-users@public.kitware.com`.
