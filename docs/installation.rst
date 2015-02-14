====================
    Installation
====================

There are two ways to install Tangelo: from the Python Package Index (PyPI), or from
source.  Installing from PyPI is simpler, but limited to public release
versions; installing from source is slightly more complicated but allows you to
run cutting-edge development versions.

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
can download, build, and install from GitHub, following these steps:

**1. Install software dependencies**

To build Tangelo from source, you will need to install the following software:

* Git
* Python 2.7
* Virtualenv 12.0
* Node.js
* Grunt

**2. Check out the Tangelo source code**

Issue this git command to clone the Tangelo repository: ::

    git clone git://github.com/Kitware/tangelo.git

This will create a directory  named ``tangelo`` containing the source code.  Use
``cd`` to move into this directory: ::

    cd tangelo

**3. Install Node dependencies**

Issue this command to install the necessary Node dependencies via the Node
Package Manager (NPM): ::

    npm install

The packages will be installed to a directory named ``node_modules``.

**4. Select your Virtualenv version**

If the Virtualenv executable you wish to use is invoked in a non-standard way,
use the Grunt ``config`` task to let Grunt know how to invoke Virtualenv.  For
example, on Arch Linux systems, Virtualenv for Python 2.7 is invoked as
``virtualenv2``.  In such a case, you would issue the following Grunt command:
::

    grunt config:virtualenv:virtualenv2

By default, Grunt will assume that Virtualenv is invokable via ``virtualenv``.
*Note that, in most cases, you will not have to complete this step.*

**5. Begin the build process**

Issue this command to kick off the Grunt build process: ::

    grunt

The output will include several phases of action, including:  bcreating a
virtual environment (in the directory named ``venv``), building documentation,
creating a Tangelo package, and installing that package to the virtual
environment.

Watch the output for any errorrs.  In most cases, an error will halt the
process, displaying a message to indicate what happened.  If you need any help
deciphering any such errors, drop us a note at
tangelo-users@public.kitware.com.

**6. Launch Tangelo**

If all has gone well, you can now try to run Tangelo, using this command: ::

    ./venv/bin/tangelo --examples

The Tangelo executable comes from installing the built Tangelo Python package
into the development virtual environment, so the command assumes you are in the
root of the Tangelo repository, since that is where the virtual environment is
created by the build process.

If you open a web browser and go to http://localhost:8080, you should see a
welcome message along with the Tangelo Sunrise.  If instead you receive an error
message about port 8080 not being free, you may need to launch Tangelo on a
different port, using a command similar to the following: ::

    ./venv/bin/tangelo --examples --port 9090

Running the Test Suites
-----------------------

Tangelo comes with a battery of server and client tests.  To run these, you can
invoke the Grunt test task as follows: ::

    grunt test

This runs both the server and client tests.  Each test suite can be run on its
own, with::

    grunt test:server

and::

    grunt test:client

Each of these produces a summary report on the command line.  To view details
such as individual test results, or details about code coverage, you can launch
Tangelo to serve the HTML reports with the Grunt serve task::

    grunt serve:test

and point a web browser at http://localhost:50047.
