====================
    Installation
====================

Tangelo currently runs on Linux, OS X, and Windows.  It may run on other
UNIXlike operating systems as well, but these are the three supported platforms.

Linux and OS X
==============

**1. Install software dependencies**

Install the following software, which is required to download, build, deploy,
and run Tangelo:

.. todo::
    **Hyperlink the software packages to their homepages.**

* GNU Make
* CMake
* Git
* Python 2.7
* CherryPy 3.2

The following dependencies are optional; the example application pack relies on them:

* NLTK
* NLTK data
* MongoDB
* PyMongo

**2. Check out the Tangelo source code**

Issue this git command to clone the Tangelo repository:

``git clone git://github.com/Kitware/tangelo.git``

This will create a directory called ``tangelo`` containing the source code.

**3. Configure the build**

Create a build directory and move into it:

``mkdir tangelo-build
cd tangelo-build``

Run ``cmake`` or ``ccmake`` to configure, supplying the source code directory as
its argument.  

``ccmake ../tangelo``

``ccmake`` will present you with a curses-based configuration interface that
will allow you to edit the configuration options (some operating systems
provide ``ccmake`` and ``cmake`` in different packages - check your local
documentation).  The following options can be set if you wish, but the default
values should be fine as well:

* ``BUILD_TESTING`` - Generates a ``ctest`` suite for validating the JavaScript
  code with ``jslint``, running unit tests, etc.
* ``DEPLOY_TEST_SERVICES`` - Includes the "testing" web services in the deployed
  server.
* ``BUILD_DOCUMENTATION`` - Generates Tangelo documentation (the very document
  you are reading!) during build.
* ``MANGLE`` and ``MINIFY`` - Options to the JavaScript minifier: ``MANGLE``
  replaces non-public variable names with shorter strings, while ``MINIFY``
  removes all unnecessary whitespace, resulting in smaller code to transmit over
  the network.
* ``SERVER_HOSTNAME`` and ``SERVER_PORT`` - The name of the host that will run
  the server, and the port number on which it will run.

**4. Build the server**

Run the ``make`` command:

``make``

This will create a directory ``deploy`` in the ``tangelo-build`` directory,
containing the deployed Tangelo server.

**5. Start the server!**

The ``tangelo`` program (in the ``deploy`` directory) controls startup and
shutdown of the Tangelo server.  Run

``cd deploy
./tangelo start``

to launch the server (on `localhost:8080 <http://localhost:8080>`_ by default).  Point your browser there
and check out the demos!
